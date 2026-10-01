import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { config } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

let adminApp = null;
let adminAuth = null;

export const initializeFirebaseAdmin = () => {
  if (adminApp && adminAuth) {
    return { adminApp, adminAuth };
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    adminAuth = getAuth(adminApp);
    return { adminApp, adminAuth };
  }

  const { projectId, clientEmail, privateKey } = config.firebase;

  if (!projectId || !clientEmail || !privateKey) {
    throw new AppError(
      'Firebase Admin credentials are missing. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your environment configuration.',
      500,
      'FIREBASE_CONFIG_ERROR'
    );
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    adminAuth = getAuth(adminApp);
    logger.info('Firebase Admin initialized successfully');
    return { adminApp, adminAuth };
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK');
    throw new AppError(
      'Failed to initialize Firebase Admin SDK due to invalid configuration or credentials.',
      500,
      'FIREBASE_INIT_ERROR'
    );
  }
};

export { adminApp, adminAuth };
