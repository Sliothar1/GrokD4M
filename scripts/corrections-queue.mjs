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
 *   list                 removal requests first, then corrections (no contact details shown)
 *   show <id>            full item, including name/email if given
 *   resolve <id>         DELETE the item once it is resolved (privacy: we don't keep it)
 * Local dev (no token): reads ./.corrections-local/ instead.
 */
import { del, get, list } from "@vercel/blob";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const PREFIX = "corrections/open/";
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
const LOCAL = path.join(process.cwd(), ".corrections-local", PREFIX);
if (token && !storeId) {
  console.error("Set CORRECTIONS_STORE_ID for the private corrections store.");
  process.exit(1);
}

async function items() {
  if (!token) {
    if (!existsSync(LOCAL)) return [];
    const out = [];
    const walk = (d) => {
      for (const f of readdirSync(d)) {
        const p = path.join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (f.endsWith(".json")) out.push({ ref: p, local: true, pathname: path.relative(LOCAL, p) });
      }
    };
    walk(LOCAL);
    return out.sort((a, b) => a.pathname.localeCompare(b.pathname));
  }
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000, ...auth });
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

async function read(it) {
  if (it.local) return JSON.parse(readFileSync(it.ref, "utf8"));
  const r = await get(it.ref, { access: "private", ...auth, useCache: false });
  if (!r || r.statusCode !== 200) throw new Error(`cannot read ${it.pathname}`);
  return JSON.parse(await new Response(r.stream).text());
}

async function find(id) {
  for (const it of await items()) if (it.pathname.endsWith(`-${id}.json`)) return it;
  throw new Error(`no open item with id ${id}`);
}

const [cmd = "list", id] = process.argv.slice(2);
try {
  if (cmd === "list") {
    const all = await items();
    if (!all.length) console.log("Queue is empty.");
    for (const it of all) {
      const s = await read(it);
      const flag = s.priority === "removal" ? "PRIORITY REMOVAL" : "correction";
      console.log(
        `${s.id}  ${s.receivedAt}  ${flag.padEnd(16)}  ${s.page}  ` +
          `${JSON.stringify(s.whatsWrong.slice(0, 80))}${s.email || s.name ? "  [contact given]" : ""}`
      );
    }
  } else if (cmd === "show" && id) {
    console.log(JSON.stringify(await read(await find(id)), null, 2));
  } else if (cmd === "resolve" && id) {
    const it = await find(id);
    if (it.local) rmSync(it.ref);
    else await del(it.ref, auth);
    console.log(`Deleted ${id} (${it.pathname}).`);
  } else {
    console.log("usage: corrections-queue.mjs list | show <id> | resolve <id>");
    process.exitCode = 2;
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
}
