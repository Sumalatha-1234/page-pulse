# Page Pulse

A small tool that audits any URL: it fetches the page, checks the HTTP status
and timing, and reports basic SEO/accessibility signals (title, meta
description, H1 count, image alt-text coverage, word count).

Built for the Digital Heroes SDE qualification task (Task A + Task B).

- **Backend:** Node.js, Express, Axios, Cheerio
- **Frontend:** React (Vite)
- **Tests:** Jest, Supertest, Nock

```
page-pulse/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app (exported for testing)
│   │   ├── server.js           # Entry point — starts the HTTP server
│   │   ├── routes/audit.js     # POST /api/audit
│   │   ├── services/
│   │   │   └── auditService.js # Fetches + parses the target page
│   │   └── utils/
│   │       └── validateUrl.js  # Input validation / SSRF guard
│   └── tests/
│       ├── validateUrl.test.js
│       ├── auditService.test.js  # Parsing logic: happy path + 2 failure cases
│       └── audit.route.test.js   # HTTP-level integration tests
└── frontend/
    └── src/
        ├── App.jsx
        └── components/
            ├── AuditForm.jsx
            ├── ReportCard.jsx
            ├── ErrorBanner.jsx
            ├── PulseLine.jsx      # Loading indicator
            └── Footer.jsx
```

## 1. Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev        # starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev         # starts on http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000` (see
`frontend/vite.config.js`), so no extra config is needed for local
development. For a deployed backend, set `VITE_API_BASE_URL` — see
`frontend/.env.example`.

### Running tests

```bash
cd backend
npm test
```

Tests use `nock` to mock all outbound HTTP calls, so they run fully offline
and deterministically — no real network access is required or made.

## 2. API contract

### `POST /api/audit`

Fetches the given URL and returns an audit report.

**Request body**

```json
{ "url": "https://example.com" }
```

**Success response — `200 OK`**

```json
{
  "url": "https://example.com/",
  "httpStatus": 200,
  "responseTimeMs": 184,
  "title": "Example Domain",
  "metaDescription": null,
  "h1Count": 1,
  "images": { "total": 0, "missingAlt": 0 },
  "wordCount": 28,
  "checkedAt": "2026-07-24T10:15:00.000Z"
}
```

**Error responses** — all errors share the shape `{ "error": { "message": string, "code": string } }`

| Status | Code                  | Meaning                                              |
| ------ | --------------------- | ----------------------------------------------------- |
| 400    | `INVALID_URL`          | Missing, malformed, non-http(s), or a local/private address |
| 422    | `NON_HTML_RESPONSE`    | The target responded with a non-HTML content type     |
| 502    | `UPSTREAM_HTTP_ERROR`  | The target page returned an HTTP 4xx/5xx status        |
| 502    | `DNS_ERROR`            | The domain could not be resolved                       |
| 502    | `CONNECTION_REFUSED`   | The target server refused the connection                |
| 502    | `FETCH_FAILED`         | Any other network-level failure                        |
| 504    | `TIMEOUT`              | The target didn't respond within 8 seconds              |
| 500    | `INTERNAL_ERROR`       | Unexpected server-side error (never a crash)             |

### `GET /api/health`

Returns `{ "status": "ok" }` — used for uptime checks and deployment smoke tests.

## 3. Design decisions

**1. `fetchPage` and `analyzeHtml` are separate functions in `auditService.js`.**
Network I/O and pure HTML parsing are different concerns with different
failure modes and different test strategies. Splitting them means the parsing
logic (title, H1 count, alt-text coverage, word count) can be unit-tested
directly on a string of HTML with no HTTP involved, while network failures
(timeouts, DNS, non-2xx) are tested by mocking the transport layer with
`nock`. This keeps tests fast and precise about which layer failed.

**2. All failure modes funnel into one `AuditError` class carrying an HTTP
status and a machine-readable code.** Rather than throwing raw Axios errors
or generic `Error` objects, every anticipated failure (invalid URL, timeout,
DNS failure, non-HTML content, upstream 4xx/5xx) is normalized into the same
shape before it reaches the route handler. The route only needs one
`instanceof AuditError` check to decide how to respond, and the frontend only
needs to read `error.error.message`. Anything that *isn't* an `AuditError` is
treated as a genuine bug and logged, then returned as a generic 500 — so the
process never crashes on unexpected input and the person calling the API
always gets a consistent JSON shape.

**3. URL validation blocks localhost and private IP ranges before any
request is made.** Because the endpoint fetches a URL supplied by the
client, it's a classic SSRF surface — without this check, the service could
be used to probe internal infrastructure that happens to be reachable from
the server. `validateUrl.js` rejects non-http(s) protocols and known
local/private hostnames up front, before Axios ever opens a connection. This
is a deliberately simple heuristic (not exhaustive DNS-rebinding protection)
appropriate for the scope of this task, called out explicitly here as a
known limitation rather than left implicit.

## 4. What I'd change with another day

- Add DNS-level SSRF protection (resolve the hostname first and check the
  resolved IP, not just the literal hostname in the URL — this closes the
  DNS-rebinding gap in decision #3 above).
- Cache recent audits by URL for a short TTL to avoid hammering the same
  target on repeated submissions.
- Add a request-rate limiter (e.g. `express-rate-limit`) in front of
  `/api/audit` since it proxies outbound requests on the caller's behalf.
- Expand the report with more accessibility checks (heading order, link text
  quality, image dimensions) and a basic performance signal (page weight).

## 5. Deployment

### Backend → Render

1. Push this repo to GitHub.
2. In Render: **New → Web Service**, connect the repo, set **Root
   Directory** to `backend`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add environment variable `PORT` is set automatically by Render — no
   action needed (the app already reads `process.env.PORT`).
5. Deploy. Note the resulting URL, e.g. `https://page-pulse-api.onrender.com`.
6. Sanity check: `curl https://page-pulse-api.onrender.com/api/health`.

### Frontend → Vercel

1. In Vercel: **Add New → Project**, import the same repo, set **Root
   Directory** to `frontend`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory:
   `dist`.
3. Add environment variable `VITE_API_BASE_URL` =
   `https://page-pulse-api.onrender.com/api` (your Render URL + `/api`).
4. Deploy.

### CORS note

The backend enables `cors()` with default (permissive) settings so it can be
called from any deployed frontend origin without extra configuration. For a
stricter production setup, restrict it to the known Vercel domain via
`cors({ origin: "https://your-frontend.vercel.app" })`.

## 6. Loom demo script (2–3 min)

1. **(0:00–0:20)** Show the live URL. State what it does in one sentence:
   audits a URL for status, timing, and basic SEO/accessibility signals.
2. **(0:20–0:50)** Run a real audit against a normal site. Point out the
   status pill, response time, word count, H1 count, and alt-text coverage
   updating.
3. **(0:50–1:20)** Run the two failure cases live:
   - An invalid string (e.g. `not a url`) → show the 400 error inline.
   - A URL that 404s → show the 502 error inline, and note it doesn't crash
     the app.
4. **(1:20–1:50)** Switch to the code. Open `auditService.js`, show
   `fetchPage` vs `analyzeHtml`, and explain design decision #1 out loud.
5. **(1:50–2:20)** Open `audit.route.test.js`, run `npm test`, show the
   happy path and the two failure-case tests passing.
6. **(2:20–2:50)** Walkthrough + self-critique: pick one real thing you'd
   change with more time (e.g. the SSRF DNS-rebinding gap from section 4)
   and explain, concretely, what you'd do differently and why.
7. **(2:50–3:00)** Close by pointing at the GitHub repo link and the footer
   credit line.
