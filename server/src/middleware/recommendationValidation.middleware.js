import { AppError } from '../utils/errors.js';

const MAX_LENGTHS = Object.freeze({
  id: 128,
  title: 500,
  description: 4000,
  content: 12000,
  author: 300,
  url: 2048,
  urlToImage: 2048,
  publishedAt: 64
});
const ALLOWED_FIELDS = new Set([...Object.keys(MAX_LENGTHS), 'source']);
const invalid = () => new AppError('Invalid related-news request.', 400, 'RECOMMENDATION_VALIDATION_ERROR');

const validateOptionalText = (value, maxLength) => value === undefined || value === null
  || (typeof value === 'string' && value.length <= maxLength);

export const validateRecommendationRequest = (req, res, next) => {
  const article = req.body?.article;
  const limitValue = req.body?.limit;
  if (!article || typeof article !== 'object' || Array.isArray(article)) throw invalid();
  if (Object.keys(req.body).some((key) => !['article', 'limit'].includes(key))) throw invalid();
  if (Object.keys(article).some((key) => !ALLOWED_FIELDS.has(key))) throw invalid();
  if (typeof article.title !== 'string' || !article.title.trim() || article.title.length > MAX_LENGTHS.title) throw invalid();

  for (const [field, maxLength] of Object.entries(MAX_LENGTHS)) {
    if (!validateOptionalText(article[field], maxLength)) throw invalid();
  }

  if (article.source !== undefined && (!article.source || typeof article.source !== 'object' || Array.isArray(article.source)
    || Object.keys(article.source).some((key) => !['id', 'name'].includes(key))
    || !validateOptionalText(article.source.id, 200)
    || !validateOptionalText(article.source.name, 200))) throw invalid();

  for (const field of ['url', 'urlToImage']) {
    if (article[field] !== undefined && article[field] !== null) {
      try {
        const parsed = new URL(article[field]);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw invalid();
      } catch {
        throw invalid();
      }
    }
  }

  if (article.publishedAt !== undefined && article.publishedAt !== null && Number.isNaN(Date.parse(article.publishedAt))) throw invalid();
  if (limitValue !== undefined && (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 10)) throw invalid();

  req.recommendationInput = { article, limit: limitValue || 5 };
  next();
};
