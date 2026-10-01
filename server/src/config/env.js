import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

export const config = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: isNaN(port) ? 5000 : port,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  firebase: Object.freeze({
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : ''
  }),
  isProduction: (process.env.NODE_ENV || 'development') === 'production'
});
