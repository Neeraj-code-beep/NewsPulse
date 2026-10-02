import crypto from 'crypto';

/**
 * Generates a deterministic SHA-256 hash for an article.
 * @param {Object} article
 * @returns {string} Hex encoded hash
 */
export const generateArticleId = (article) => {
  if (!article) return '';

  const identifierSource = article.url || `${article.title || ''}-${article.publishedAt || ''}`;
  return crypto.createHash('sha256').update(identifierSource).digest('hex');
};
