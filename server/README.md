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

- Node.js (v18 or higher recommended)
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
```

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
