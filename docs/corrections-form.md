# S3: Correction / removal form (D4M)

**Status:** built on branch `d4m/s3-corrections-form`. **Go-live needs Garry's OK on the preview.**

## What users see
- Every `/player/*` and `/club/*` page has a footer link: **"Suggest a correction or request removal"**. It goes to `/corrections?page=/player/<slug>`.
- The form has these fields:
  - **page** (prefilled, read-only)
  - **what's wrong** (required)
  - **source link** (optional)
  - **"I'm asking for something to be removed"** checkbox
  - **name** and **email** (both optional)
- A privacy line on the form says what we keep, why, that it stays private, and that we delete it once the request is resolved.
- `/corrections` is `noindex`, and the link is `rel=nofollow`.

## Abuse controls
- **Honeypot:** a hidden `website` field. If it's filled in, the server returns a fake success and stores nothing.
- **Minimum fill time:** a submit less than 3 seconds after the form renders gets the same fake success, with nothing stored.
- **Rate limit** (in memory, per serverless instance): 3 per 10 minutes and 10 per day per client, plus 60 per hour per instance. Clients are keyed by a salted hash of the IP, which is never stored or logged.
- **Input checks:** page must match `/player|club/<slug>`; text is capped at 4,000 characters, URL at 500, name at 100 and email at 200; the URL must be http(s); the email gets a basic format check.

## Where submissions go (private only)
- They go to a **private Vercel Blob store**, under `corrections/open/p0-removal/…` (priority) or `corrections/open/p1-correction/…`.
- They are **never** written to the public cuttings store, GitHub issues, the repo or any page.
- There is **no GET or list endpoint**: `GET /api/corrections` returns 405.
- `@vercel/blob` ignores `token` when an OIDC token and `BLOB_STORE_ID` are present, and `BLOB_STORE_ID` here is the public cuttings store. So the code always passes the corrections `storeId` explicitly. It fails closed if no store id is set. After every write it checks that the URL host is `*.private.blob.vercel-storage.com`; if not, it deletes the item and errors.
- `src/lib/articles.ts` alias logic now skips `CORRECTIONS_*` env vars, so the public cuttings code can never pick up the private store.
- In local dev with no token, items are written to `./.corrections-local/`, which is gitignored.

## Moderation view
This is a CLI only, with no web route:
- Run `node --env-file=.env.local scripts/corrections-queue.mjs list | show <id> | resolve <id>`.
- `list` shows removal requests first and doesn't print contact details.
- `show` prints the full item.
- `resolve` **deletes** the item, per the privacy line.

## Env vars (Vercel → project hurlingwiki)
| Var | Needed for | Default |
|---|---|---|
| `CORRECTIONS_FORM_ENABLED=1` | showing the link and form in **Production** (Garry's go-live switch). `=0` forces it off everywhere | off in Production, on in Preview and dev |
| `CORRECTIONS_READ_WRITE_TOKEN` (made by connecting a **new private** Blob store with prefix `CORRECTIONS`) or `CORRECTIONS_BLOB_READ_WRITE_TOKEN` | saving submissions | none. Without it the API returns 503 and saves nothing |
| `CORRECTIONS_STORE_ID` | explicit private store id (recommended; otherwise parsed from the token) | parsed from the token |
| `CORRECTIONS_NOTIFY=resend` + `RESEND_API_KEY` + `CORRECTIONS_NOTIFY_FROM` (+ optional `CORRECTIONS_NOTIFY_TO`, default garrylohan@gmail.com) | email to Garry for each new item (see "Notification content" below) | **off** |
| `CORRECTIONS_RL_SALT` | optional salt for the rate-limit hash | random per instance |

## Notification content (Bainisteoir QC)
- The subject and the body are the same single line, built only from the request type, the page path and the queue id:
  `New correction request: /player/<slug>, id <id>` or `New removal request: /club/<slug>, id <id>`.
- The email never carries the submitter's name, email, message text or source link, or the received time. Garry reads everything else from the private queue (`scripts/corrections-queue.mjs show <id>`).

## Logging
- Server logs carry status only: `corrections: notify skipped: …` / `notify failed: HTTP <code>` / `notify failed: <ErrorName>`, and `corrections: save failed <ErrorName>`.
- No submitter fields (name, email, message text, source link) and no IPs are ever logged.

## Known limits and decisions
- The existing public Blob store (`hurlingwiki-blob1`) was **suspended on Hobby** as of 11 Sep. A private store also counts against Hobby Blob limits: the form writes one simple op per submission, and moderation uses list ops. Garry decides between a new private store on Hobby and Pro.
- The in-memory rate limit is per instance, so it's best-effort. A shared limit would need KV/Upstash, which means a new secret, so I didn't add it.
