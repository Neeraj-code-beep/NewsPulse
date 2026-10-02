import { initializeFirebaseAdmin } from '../config/firebase.js';
import { AppError } from '../utils/errors.js';

const authRequired = () =>
  new AppError('Authentication required', 401, 'AUTH_REQUIRED');

const invalidToken = () =>
  new AppError('Invalid or expired authentication token', 401, 'AUTH_INVALID_TOKEN');

export const createRequireAuth = (
  getFirebaseAuth = () => initializeFirebaseAdmin().adminAuth
) => async (req, res, next) => {
  const authorization = req.get('authorization');

  if (!authorization) {
    return next(authRequired());
  }

  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  if (!match) {
    return next(invalidToken());
  }

  let firebaseAuth;
  try {
    firebaseAuth = getFirebaseAuth();
  } catch (error) {
    return next(error);
  }

  try {
    const claims = await firebaseAuth.verifyIdToken(match[1]);
    if (typeof claims?.uid !== 'string' || claims.uid.length === 0) {
      return next(invalidToken());
    }

    req.user = {
      uid: claims.uid,
      email: typeof claims.email === 'string' ? claims.email : null,
      emailVerified: claims.email_verified === true
    };

    return next();
  } catch {
    return next(invalidToken());
  }
};

export const requireAuth = createRequireAuth();
