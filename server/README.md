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

CLIENT_URL=http://localhost:5173

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
NEWS_API_KEY=your-newsapi-key
GEMINI_API_KEY=your-gemini-api-key
AI_MODEL=gemini-3.5-flash-lite
AI_SUMMARY_CACHE_TTL_MS=86400000
AI_SUMMARY_MAX_INPUT_LENGTH=12000
AI_SUMMARY_TIMEOUT_MS=30000
```

`GEMINI_API_KEY` is server-only and must never be added to the frontend environment. AI settings have development defaults for model, cache TTL (24 hours), maximum article text (12,000 characters), and provider timeout (30 seconds). Numeric settings must be positive integers; the server bounds cache TTL to 30 days, maximum input to 50,000 characters, and timeout to 120 seconds. The key is required only when a cache miss needs a live generation; without it the endpoint returns `AI_CONFIGURATION_ERROR`.

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
