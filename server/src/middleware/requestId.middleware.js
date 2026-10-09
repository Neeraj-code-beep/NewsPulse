import { randomUUID } from 'node:crypto';

export const requestIdMiddleware = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};
