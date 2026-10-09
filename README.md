# 📰 News Application

A responsive React + Vite news application backed by an Express API, Firebase Authentication/Firestore, NewsAPI, Gemini summaries, related-news recommendations, and Socket.IO live updates.


---

## ✨ Features

- Browse the latest news by category  
- Responsive design (mobile & desktop)  
- Fast builds & hot reload with **Vite**  
- Clean codebase with **ESLint** rules  

---

## 🛠️ Tech Stack

- **React 18 + Vite** – Frontend framework & bundler  
- **Tailwind CSS** – Utility-first styling  
- **ESLint** – Code linting  
- **Node.js + Express** – API gateway and server-side provider integrations
- **Firebase** – Authentication and per-user Firestore favourites
- **Socket.IO** – Process-local live headline updates
- **Node.js + Express** – API gateway and server-side provider integrations
- **Firebase** – Authentication and per-user Firestore favourites
- **Socket.IO** – Process-local live headline updates

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+ (required by the backend and Google GenAI SDK)
- npm or yarn  

### Installation

```bash
# Clone the repo
git clone https://github.com/Kushan2k/news-application.git
cd news-application

# Install dependencies
npm install
# or
yarn install

```

## Projecut Structure
```bash
news-application/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── styles/         # Global styles
│   └── main.jsx        # App entry point
├── .env.sample         # Example environment variables
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md

```

## Configuration

The frontend reads its Vite settings from a root `.env` file. Copy `.env.example` to `.env` and configure the Firebase web-app settings and backend URL. Firebase web configuration is public client configuration; never put NewsAPI, Gemini, or Firebase Admin credentials in frontend variables.

```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Run the frontend with `npm run dev` from the repository root. Run the API in a second terminal with `cd server`, copy `server/.env.example` to `server/.env`, configure the server secrets, and run `npm start` (or `npm run dev` during development). Production configuration, health endpoints, proxy assumptions, Socket.IO/WSS, and process-local limits are documented in [server/README.md](server/README.md).

## Firestore bookmarks

Bookmark documents use the `favourites/{uid}` path and store article entries in a `favourites` array. The rules in `firestore.rules` allow authenticated users to read and write only the document whose ID matches their Firebase UID; collection listing is denied. After selecting the Firebase project in the Firebase CLI, deploy the rules from the repository root with:

```bash
firebase deploy --only firestore:rules
```
