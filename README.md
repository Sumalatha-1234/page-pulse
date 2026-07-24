# Page Pulse

A small tool that audits any URL: it fetches the page, checks the HTTP status and response timing, and reports basic SEO/accessibility signals including title, meta description, H1 count, image alt-text coverage, and approximate word count.

Built for the Digital Heroes SDE qualification task (Task A + Task B).

## Live Demo

Frontend:

```
<YOUR_VERCEL_URL>
```

Backend API:

```
https://page-pulse-production-df6d.up.railway.app
```

Health check:

```
GET https://page-pulse-production-df6d.up.railway.app/api/health
```

## Tech Stack

* **Backend:** Node.js, Express, Axios, Cheerio
* **Frontend:** React (Vite)
* **Testing:** Jest, Supertest, Nock
* **Deployment:** Railway (Backend), Vercel (Frontend)

## Project Structure

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
│   │       └── validateUrl.js  # Input validation / SSRF protection
│   └── tests/
│       ├── validateUrl.test.js
│       ├── auditService.test.js
│       └── audit.route.test.js
└── frontend/
    └── src/
        ├── App.jsx
        └── components/
            ├── AuditForm.jsx
            ├── ReportCard.jsx
            ├── ErrorBanner.jsx
            ├── PulseLine.jsx
            └── Footer.jsx
```

# 1. Setup

## Prerequisites

* Node.js 18+
* npm 9+

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs locally on:

```
http://localhost:4000
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs locally on:

```
http://localhost:5173
```

For local development, the frontend communicates with the backend API.

For deployment, configure:

```
VITE_API_BASE_URL
```

with the Railway backend URL.

## Running Tests

```bash
cd backend
npm test
```

Tests use mocked HTTP requests, so they run deterministically without making real external network calls.

Current test status:

```
17 tests passed
```

---

# 2. API Contract

## POST `/api/audit`

Fetches the provided URL and returns an audit report.

### Request

```json
{
  "url": "https://example.com"
}
```

### Success Response - 200 OK

```json
{
  "url": "https://example.com/",
  "httpStatus": 200,
  "responseTimeMs": 184,
  "title": "Example Domain",
  "metaDescription": null,
  "h1Count": 1,
  "images": {
    "total": 0,
    "missingAlt": 0
  },
  "wordCount": 28,
  "checkedAt": "2026-07-24T10:15:00.000Z"
}
```

## Error Response Format

All errors follow:

```json
{
  "error": {
    "message": "error message",
    "code": "ERROR_CODE"
  }
}
```

## Error Codes

| Status | Code                | Meaning                          |
| ------ | ------------------- | -------------------------------- |
| 400    | INVALID_URL         | Invalid or unsafe URL            |
| 422    | NON_HTML_RESPONSE   | Response is not HTML             |
| 502    | UPSTREAM_HTTP_ERROR | Target page returned 4xx/5xx     |
| 502    | DNS_ERROR           | Domain could not be resolved     |
| 502    | CONNECTION_REFUSED  | Target server refused connection |
| 502    | FETCH_FAILED        | Other network failure            |
| 504    | TIMEOUT             | Request exceeded timeout         |
| 500    | INTERNAL_ERROR      | Unexpected server error          |

## GET `/api/health`

Returns:

```json
{
  "status": "ok"
}
```

Used for deployment health checks.

---

# 3. Design Decisions

## 1. Separate page fetching and HTML analysis

`fetchPage()` and `analyzeHtml()` are separated inside `auditService.js`.

The reason is that network communication and HTML parsing have different responsibilities and failure cases.

This separation allows HTML parsing logic to be tested independently without making real HTTP requests, while network failures can be tested separately through mocked requests.

---

## 2. Centralized error handling using AuditError

All expected failures are converted into a custom `AuditError` class containing:

* HTTP status code
* machine-readable error code
* user-friendly message

This keeps API responses consistent and prevents raw Axios errors from leaking to clients.

Unexpected errors are handled separately and return a safe 500 response instead of crashing the application.

---

## 3. URL validation for SSRF protection

Since the API fetches user-provided URLs, it can become a Server-Side Request Forgery (SSRF) risk.

The application validates URLs before making requests by blocking:

* invalid protocols
* localhost addresses
* private IP ranges

This prevents the service from being used to access internal resources.

A future improvement would be validating resolved DNS IP addresses to protect against DNS rebinding attacks.

---

# 4. Improvements With More Time

If I had another day to improve Page Pulse, I would:

* Add DNS-level SSRF protection by validating resolved IP addresses.
* Add caching for repeated audits to reduce unnecessary requests.
* Add rate limiting to protect the audit endpoint.
* Expand accessibility checks such as heading order, link quality, and image dimensions.
* Add performance metrics such as page size and loading resources.

---

# 5. Deployment

## Backend Deployment - Railway

The backend is deployed using Railway.

Backend URL:

```
https://page-pulse-production-df6d.up.railway.app
```

The server starts using:

```bash
npm start
```

Railway automatically provides the required PORT environment variable.

Health check:

```
https://page-pulse-production-df6d.up.railway.app/api/health
```

---

## Frontend Deployment - Vercel

The frontend is deployed using Vercel.

Configuration:

* Framework: Vite
* Build command:

```bash
npm run build
```

* Output directory:

```
dist
```

Environment variable:

```
VITE_API_BASE_URL=https://page-pulse-production-df6d.up.railway.app
```

The frontend sends requests to:

```
POST /api/audit
```

---

# 6. Loom Demo Plan (2-3 minutes)

## 0:00 - 0:30

Show the deployed application.

Explain:

"Page Pulse audits any URL and provides HTTP status, response time, SEO details, and accessibility information."

## 0:30 - 1:00

Run an audit using:

```
https://example.com
```

Show:

* HTTP status
* Response time
* Title
* H1 count
* Image alt coverage
* Word count

## 1:00 - 1:30

Show failure handling:

Example:

```
invalid-url
```

Explain how the application returns errors without crashing.

## 1:30 - 2:00

Show backend code:

Open:

```
backend/src/services/auditService.js
```

Explain the separation between:

* fetchPage()
* analyzeHtml()

## 2:00 - 2:30

Show tests:

Run:

```bash
npm test
```

Show:

```
17 tests passed
```

## Final explanation

Mention one improvement:

"With more time, I would add DNS-based SSRF protection and caching for repeated audits."
