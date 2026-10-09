# NewsPulse API Server

The backend API server for NewsPulse, built with Node.js and Express.

## Overview

This server provides the backend infrastructure and API layer for the NewsPulse application, featuring:
- Express-based modular architecture
- Security middleware (Helmet, CORS)
- Rate limiting for API endpoints
- Centralized error handling and logging
- Versioned API routing (`/api/v1`)
- Firebase Admin SDK integration foundation

## Requirements

- Node.js (v20 or higher required by the Google GenAI SDK)
- npm

## Getting Started

### 1. Installation

Navigate to the `server` directory and install dependencies:

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your environment variables in `.env`:

```env
NODE_ENV=development
PORT=5000
SHUTDOWN_TIMEOUT_MS=10000
TRUST_PROXY_HOPS=0

CLIENT_URL=http://localhost:5173

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
NEWS_API_KEY=your-newsapi-key
NEWS_API_BASE_URL=https://newsapi.org/v2
NEWS_CACHE_TTL_MS=900000
CACHE_MAX_ENTRIES=1000
LIVE_NEWS_ENABLED=true
LIVE_NEWS_POLL_INTERVAL_MS=900000
LIVE_NEWS_PAGE_SIZE=20
LIVE_NEWS_SEEN_LIMIT=500
GEMINI_API_KEY=your-gemini-api-key
AI_MODEL=gemini-3.5-flash-lite
AI_SUMMARY_CACHE_TTL_MS=86400000
AI_SUMMARY_MAX_INPUT_LENGTH=12000
AI_SUMMARY_TIMEOUT_MS=30000
```

All backend environment values are parsed centrally and invalid ports, URLs, TTLs, proxy-hop counts, live polling values, and AI limits prevent startup. The production `npm start` command also requires an HTTPS `CLIENT_URL`, Firebase Admin project ID/email/private key, `NEWS_API_KEY`, and `GEMINI_API_KEY`; errors list missing variable names without printing secret values. Use `\\n` separators or real newlines in `FIREBASE_PRIVATE_KEY`. Keep credentials in the host's secret manager or an ignored local `.env` file. Never add NewsAPI, Gemini, Firebase Admin, or private credentials to `VITE_*` variables.

`GEMINI_API_KEY` is server-only. AI settings default to model `gemini-3.5-flash-lite`, cache TTL 24 hours, maximum article text 12,000 characters, and a 30 second provider timeout. The server bounds AI cache TTL to 30 days, maximum input to 50,000 characters, and timeout to 120 seconds. `NEWS_CACHE_TTL_MS` is bounded to 30 days; `CACHE_MAX_ENTRIES` defaults to 1,000 entries and accepts 100–10,000. Live-news settings validate the interval (60 seconds–1 hour), page size (1–50), and seen-state limit (50–5,000).

Production frontend hosting must set `VITE_API_BASE_URL` to the HTTPS backend origin, and `CLIENT_URL` to the exact HTTPS frontend origin. Socket.IO uses the same origin allowlist and connects using WSS through HTTPS. `TRUST_PROXY_HOPS` defaults to `0`. Set it only to the exact number of trusted reverse-proxy hops between the client and this process; do not set it to `true` or guess. Rate limits and caches are process-local, so requests reaching multiple instances do not share quotas or cached entries. Choose a single backend instance unless the deployment accepts this limitation.

The global JSON body limit is 64 KiB, URL-encoded bodies are limited to 16 KiB/100 parameters, and query parsing is capped at 50 parameters. The API returns an `X-Request-Id` for each request and includes it in error responses. Logs use structured JSON and omit query strings and raw exception messages. Production 5xx responses are generic; details are kept out of the API response.

`GET /api/v1/health` reports process liveness without calling external providers. `GET /api/v1/health/ready` checks whether NewsAPI, Firebase Admin, and Gemini configuration is present; it does not make external requests, so a provider outage does not turn readiness into a network-dependent probe. Helmet's defaults are enabled. Review them against the frontend's hosting behavior before adding custom CSP directives. HSTS is effective only when the public site is served over HTTPS.

### 3. Running the Server

#### Development Mode (with auto-reload):

```bash
npm run dev
```

#### Production Mode:

```bash
npm start
```

## Automated Tests

Run the backend test suite from the repository root:

```bash
npm test --prefix server
```

The tests use Node's built-in test runner and do not require real NewsAPI credentials or Firebase credentials. Firebase token verification and NewsAPI requests are mocked; automated tests do not call external providers.

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Root Endpoint
- **URL**: `GET /api/v1`
- **Description**: Returns API information and version.
- **Response**:
```json
{
  "success": true,
  "data": {
    "name": "NewsPulse API",
    "version": "v1"
  }
}
```

### Health Check
- **URL**: `GET /api/v1/health`
- **Description**: Checks service availability.
- **Response**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "newspulse-api",
    "timestamp": "2026-10-01T15:30:00.000Z"
  }
}
```

### Current authenticated user
- **URL**: `GET /api/v1/auth/me`
- **Authentication**: Firebase ID token in the `Authorization` header using `Bearer <token>`.
- **Description**: Verifies the Firebase ID token with Firebase Admin and returns the verified user's UID, email, and email verification status.
- **Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "firebase-user-id",
      "email": "user@example.com",
      "emailVerified": true
    }
  }
}
```

Missing or invalid tokens return HTTP 401 with `AUTH_REQUIRED` or `AUTH_INVALID_TOKEN`. The frontend API client obtains ID tokens from the current Firebase Auth user; tokens are not stored separately by the application.

### AI article summary
- **URL**: `POST /api/v1/ai/summarize`
- **Authentication**: Required. Send a Firebase ID token using `Authorization: Bearer <token>`.
- **Request**: Only `title`, `description`, `content`, and optional `url` are accepted. A non-empty title and at least a non-empty description or content are required. The URL is validated as HTTP(S) metadata and is never fetched. Content is truncated to the configured total text limit; very large request fields and unknown properties are rejected.

```json
{
  "title": "Example article title",
  "description": "A short article description.",
  "content": "Optional additional article text.",
  "url": "https://example.com/article"
}
```

Successful responses return a normalized summary and whether it came from cache:

```json
{
  "success": true,
  "data": {
    "summary": "A concise summary of the supplied article.",
    "cached": false
  }
}
```

Summaries are cached in the existing in-memory cache using a SHA-256 hash of normalized title, description, and bounded content. Successful concurrent requests for the same text share one generation. Cache entries expire using `AI_SUMMARY_CACHE_TTL_MS`; errors are not cached. The AI endpoint has an additional limit of 20 requests per IP per 15 minutes. Provider calls use the configured timeout and return safe application-level errors.

### Related news recommendations
- **URL**: `POST /api/v1/news/related`
- **Authentication**: Not required. Recommendations are based on supplied article metadata, not a user profile.
- **Request**: Send the current normalized NewsAPI article and optional `limit` from 1 through 10 (default 5). The server accepts only known article metadata fields, validates supplied URLs as HTTP(S), derives its own compact query, and never fetches the supplied article URL.

```json
{
  "article": {
    "id": "existing-deterministic-article-id",
    "title": "Example article title",
    "description": "A short description of the story.",
    "content": "Optional article content.",
    "source": { "name": "Example News" },
    "url": "https://example.com/article",
    "publishedAt": "2026-10-01T15:30:00.000Z"
  },
  "limit": 5
}
```

The response is `{ "success": true, "data": { "articles": [...] } }`. Each returned normalized article includes its existing article ID and a rounded `score` between 0 and 1. The v1 deterministic content-based score weighs title overlap most heavily, followed by description, available content, and aggregate keyword overlap. Matching source and freshness are small capped additions; relevance carries substantially more weight than freshness. Candidates below the minimum score of `0.14` are omitted, so a successful empty result is expected when nothing is sufficiently related.

Candidate articles are found through the existing NewsAPI service; recommendations do not call Gemini, use embeddings, vector search, or personalization. Results are cached in the existing process-local cache for the NewsAPI cache TTL with versioned `related:v1:<article-hash>:<limit>` keys. Concurrent identical recommendation requests share one generation. As with the existing in-memory cache, entries and in-flight coordination do not persist across restarts or synchronize between server instances. Results are limited by the provider candidate set and available article metadata; this initial lexical algorithm does not understand semantic relationships beyond token overlap.

### Real-time news updates
The HTTP server created in `src/server.js` also hosts the Socket.IO v4 server. The Express app in `src/app.js` remains independently importable for REST tests. Socket.IO uses the same configured `CLIENT_URL` origin as Express CORS; live updates are public and do not require Firebase authentication.

Clients receive the server-to-client `news:update` event. Its payload contains only newly detected articles and a fetch timestamp:

```json
{
  "articles": [{
    "title": "Article title",
    "description": "Article description",
    "url": "https://example.com/article",
    "source": { "name": "Example Source" },
    "publishedAt": "2026-10-07T10:00:00.000Z",
    "image": "https://example.com/image.jpg",
    "hash": "deterministic-article-hash"
  }],
  "fetchedAt": "2026-10-07T10:01:00.000Z"
}
```

The process starts one shared poller when its first client connects and stops the interval when its final client disconnects. The first successful poll establishes a silent baseline; later polls emit new articles only. Polls use the existing NewsService and cache with a fixed US headlines query, bounded page size, and the NewsAPI provider timeout. The default poll interval is 15 minutes to avoid aggressive provider usage. Repeated polls that hit the existing REST cache may not see newer provider results until that cache expires.

Configure the feature with:

```env
LIVE_NEWS_ENABLED=true
LIVE_NEWS_POLL_INTERVAL_MS=900000
LIVE_NEWS_PAGE_SIZE=20
LIVE_NEWS_SEEN_LIMIT=500
```

The interval is accepted from 60 seconds through one hour, page size from 1 through 50, and seen-set capacity from 50 through 5,000; invalid values use safe defaults. The poller retains a bounded set of article hashes and URL fallbacks, and overlapping polls are skipped. The frontend uses one shared Socket.IO client with Socket.IO reconnection and displays updates as pending until the reader chooses to merge them into the main feed. Live updates are disabled while searching and are not attached to category pages.

This is intentionally process-local: **one server process = one poller + one in-memory seen set**. State is reset on restart and does not synchronize between multiple backend instances. No Redis adapter or other distributed infrastructure is included. A multi-instance deployment will need future poller coordination and Socket.IO event synchronization.

### AI tests and provider verification
AI service, route, validation, configuration, and provider adapter tests use deterministic mocks; tests do not call Gemini. Run all backend tests with `npm test` from `server/`. A live Gemini request requires a valid server-side `GEMINI_API_KEY`; it is not part of automated verification. No Gemini key was configured in the implementation environment, so live-provider verification was not executed.

### Error Responses
All errors follow a standardized format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description of the error"
  }
}
```
