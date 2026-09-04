# HurlingWiki

**Galway first, Ireland next.**

Kid-friendly Galway senior hurling knowledge site (Phase 1) that showcases [MIT D4M](https://d4m.mit.edu/) associative arrays — sparse `(row, col, val)` triples you can query with `getrow`, `getcol`, and simple search.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm start
```

Scripts: `dev`, `build`, `start` (see `package.json`). Bun works too (`bun install` / `bun run build`) if you prefer.

## D4M architecture (this demo)

1. **Seed** — `data/seed.json` is a list of triples linking entities (`player:joe-canning`, `win:2017`, `club:portumna`, …) to attributes (`name`, `year`, `source`, `confidence`, …).
2. **AssocArray** — `src/lib/d4m/AssocArray.ts` loads those triples into row/column indexes (D4M-inspired, TypeScript, in-memory).
3. **Queries** — pages call `getrow` / `getcol` / `search` via helpers in `src/lib/data.ts`.
4. **Community** — story submissions append to `data/pending-stories.json` only. They never mix into official seed stats.

D4M (Dynamic Distributed Dimensional Data Model) comes from **MIT Lincoln Laboratory**, with foundational work by **Jeremy Kepner** and collaborators. Learn more: https://d4m.mit.edu/

## Demo queries

| Try this | What you should see |
| --- | --- |
| `Joe Canning` | Player entity · Portumna · 2017 links |
| `Galway All-Irelands` | Wins 1923, 1980, 1987, 1988, 2017 |
| `2017` | Final, season, win, related players/stories |
| `Portumna` | Club + Canning / Hayes links |

Code-level sketches:

```ts
const A = getAssoc();
A.getrow("player:joe-canning");
A.getcol("type");
A.search("2017");
```

## Seed highlights

- **All-Ireland wins:** 1923, 1980, 1987, 1988, 2017
- **Players:** Joe Canning, David Burke, Damien Hayes, Joe Cooney, Conor Whelan, Joseph Cooney, Cathal Mannion, Pádraic Mannion
- Clubs, seasons, matches, Wikipedia/GAA-style citations, confidence tags, and sample community stories

## MIT one-liner for X

> Built HurlingWiki: Galway hurling facts as MIT D4M-style associative arrays (row/col/val). Galway first, Ireland next. https://d4m.mit.edu/



## Cuttings uploads (Vercel Blob)

On Vercel the filesystem is read-only (`/var/task`), so cuttings cannot be written under `public/uploads` or `data/`. Production uploads use **Vercel Blob**.

### Garry setup (required for production uploads)

1. Open the Vercel project **`hurlingwiki`**.
2. Go to **Storage → Blob → Create** (choose **Public** access so cutting thumbnails can render on search/article pages).
3. Connect the Blob store to this project (Production + Preview). Vercel sets `BLOB_READ_WRITE_TOKEN` (and may also set `BLOB_STORE_ID` / OIDC).
4. Redeploy after connecting so the env vars are live.
5. Confirm uploads on **Stories → Upload a cutting**.

Without Blob connected, the API returns:  
`Uploads need Vercel Blob — connect Blob store to this project.`

### Local / dev

Without `BLOB_READ_WRITE_TOKEN`, the app keeps writing to:

- `public/uploads/articles/` (media)
- `data/article-uploads.json` (metadata)
- `data/private/article-text/` (OCR / PDF text)

### Blob layout

When Blob is configured, each cutting is stored as:

- `cuttings/media/…` — public image/PDF (URL saved as `path` / `publicUrl` / `imageUrl`)
- `cuttings/meta/{id}.json` — article metadata (listed via prefix `cuttings/meta/`)
- Private OCR text stays in the metadata JSON when small (never written under `/var/task`)

## GitHub

Local path is the source of truth for Phase 1. Later remote target: `github.com/Sliothar1/GrokD4M`. Initialise git here when ready, then add the remote and push — do not commit `node_modules/` or `.next/`.
