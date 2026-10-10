#!/usr/bin/env node
/**
 * Private moderation queue for the S3 correction / removal form.
 * There is NO web view of submissions — this CLI is the moderation view.
 *
 * Needs the private store token in the environment (never commit it):
 *   vercel env pull .env.local          # Garry's machine, project hurlingwiki
 *   node --env-file=.env.local scripts/corrections-queue.mjs list
 *
 * Commands:
 *   list                 removal requests first, then corrections, then memories (no contact details shown)
 *   show <id>            full open item, including name/email if given
 *   resolve <id>         DELETE the open item once it is resolved (privacy: we don't keep it)
 *   approve <id>         memories only: copy the text (no name, no email) to corrections/approved/, then delete the open item
 *   retract <id>         delete an approved memory so it leaves the player page
 * Nothing is published on submit. approve is the only way a memory can appear.
 * Local dev (no token): reads ./.corrections-local/ instead.
 */
import { del, get, list, put } from "@vercel/blob";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const PREFIX = "corrections/open/";
const APPROVED_PREFIX = "corrections/approved/";
const token =
  process.env.CORRECTIONS_BLOB_READ_WRITE_TOKEN || process.env.CORRECTIONS_READ_WRITE_TOKEN;
const storeId =
  process.env.CORRECTIONS_STORE_ID ||
  process.env.CORRECTIONS_BLOB_STORE_ID ||
  (/^vercel_blob_rw_([A-Za-z0-9]+)_/.exec(token || "")?.[1]
    ? `store_${/^vercel_blob_rw_([A-Za-z0-9]+)_/.exec(token)[1]}`
    : undefined);
// Always target the private store explicitly (BLOB_STORE_ID = public cuttings store).
const auth = { token, storeId };
const LOCAL_ROOT = path.join(process.cwd(), ".corrections-local");
const LOCAL = path.join(LOCAL_ROOT, PREFIX);
if (token && !storeId) {
  console.error("Set CORRECTIONS_STORE_ID for the private corrections store.");
  process.exit(1);
}

async function itemsUnder(prefix, localDir) {
  if (!token) {
    if (!existsSync(localDir)) return [];
    const out = [];
    const walk = (d) => {
      for (const f of readdirSync(d)) {
        const p = path.join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (f.endsWith(".json")) {
          out.push({ ref: p, local: true, pathname: path.relative(LOCAL_ROOT, p) });
        }
      }
    };
    walk(localDir);
    return out.sort((a, b) => a.pathname.localeCompare(b.pathname));
  }
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000, ...auth });
    for (const b of page.blobs) {
      if (!new URL(b.url).hostname.endsWith(".private.blob.vercel-storage.com")) {
        throw new Error("Refusing: listed store is not a private Blob store.");
      }
      out.push({ ref: b.pathname, local: false, pathname: b.pathname });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => a.pathname.localeCompare(b.pathname));
}

async function items() {
  return itemsUnder(PREFIX, LOCAL);
}

async function read(it) {
  if (it.local) return JSON.parse(readFileSync(it.ref, "utf8"));
  const r = await get(it.ref, { access: "private", ...auth, useCache: false });
  if (!r || r.statusCode !== 200) throw new Error(`cannot read ${it.pathname}`);
  return JSON.parse(await new Response(r.stream).text());
}

async function findIn(listFn, id, label) {
  for (const it of await listFn()) {
    if (it.pathname.endsWith(`-${id}.json`) || it.pathname.endsWith(`/${id}.json`)) return it;
  }
  throw new Error(`no ${label} item with id ${id}`);
}

function approvedPath(page, id) {
  const slug = String(page).replace(/^\//, "").replaceAll("/", "-");
  return `${APPROVED_PREFIX}${slug}/${id}.json`;
}

async function writeApproved(record) {
  const pathname = approvedPath(record.page, record.id);
  const body = JSON.stringify(
    { id: record.id, page: record.page, text: record.text, approvedAt: record.approvedAt },
    null,
    2
  );
  if (!token) {
    const file = path.join(LOCAL_ROOT, pathname);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, body, "utf8");
    return pathname;
  }
  const blob = await put(pathname, body, {
    access: "private",
    token,
    storeId,
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  if (!new URL(blob.url).hostname.endsWith(".private.blob.vercel-storage.com")) {
    await del(blob.url, auth).catch(() => undefined);
    throw new Error("Refusing: approved note did not land in a private store. Nothing was kept.");
  }
  return pathname;
}

async function removeItem(it) {
  if (it.local) rmSync(it.ref);
  else await del(it.ref, auth);
}

const [cmd = "list", id] = process.argv.slice(2);
try {
  if (cmd === "list") {
    const all = await items();
    if (!all.length) console.log("Queue is empty.");
    for (const it of all) {
      const s = await read(it);
      const flag =
        s.priority === "removal" ? "PRIORITY REMOVAL" : s.priority === "memory" ? "memory" : "correction";
      const kind = s.requestKind ? `  ${s.requestKind}` : "";
      console.log(
        `${s.id}  ${s.receivedAt}  ${flag.padEnd(16)}  ${s.page}${kind}  ` +
          `${JSON.stringify(String(s.whatsWrong || s.text || "").slice(0, 80))}${s.email || s.name ? "  [contact given]" : ""}`
      );
    }
  } else if (cmd === "show" && id) {
    console.log(JSON.stringify(await read(await findIn(items, id, "open")), null, 2));
  } else if (cmd === "resolve" && id) {
    const it = await findIn(items, id, "open");
    await removeItem(it);
    console.log(`Deleted ${id} (${it.pathname}).`);
  } else if (cmd === "approve" && id) {
    const it = await findIn(items, id, "open");
    const s = await read(it);
    if (s.priority !== "memory" && s.requestKind !== "memory") {
      throw new Error("approve is for memories only. Use resolve to delete a correction.");
    }
    const pathname = await writeApproved({
      id: s.id,
      page: s.page,
      text: s.whatsWrong,
      approvedAt: new Date().toISOString(),
    });
    await removeItem(it);
    console.log(`Approved ${id}. Text only is in ${pathname}. Name and email were not copied. Open item deleted.`);
  } else if (cmd === "retract" && id) {
    const it = await findIn(
      () => itemsUnder(APPROVED_PREFIX, path.join(LOCAL_ROOT, APPROVED_PREFIX)),
      id,
      "approved"
    );
    await removeItem(it);
    console.log(`Retracted ${id} (${it.pathname}).`);
  } else {
    console.log("usage: corrections-queue.mjs list | show <id> | resolve <id> | approve <id> | retract <id>");
    process.exitCode = 2;
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
}
