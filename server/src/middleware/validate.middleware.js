import { ValidationError } from '../utils/errors.js';

const ALLOWED_CATEGORIES = new Set([
  'business',
  'entertainment',
  'general',
  'health',
  'science',
  'sports',
  'technology'
]);

const ALLOWED_SORT_BY = new Set(['relevancy', 'popularity', 'publishedAt']);
const ALLOWED_LANGUAGES = new Set([
  'ar', 'de', 'en', 'es', 'fr', 'he', 'it', 'nl', 'no', 'pt', 'ru', 'sv', 'ud', 'zh'
]);
const MAX_QUERY_LENGTH = 500;

const invalidParameters = () => new ValidationError('Invalid request parameters');

const rejectUnknownParameters = (query, allowed) => {
  if (Object.keys(query).some((key) => !allowed.has(key))) {
    throw invalidParameters();
  }
};

const parsePositiveInteger = (value, maximum) => {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw invalidParameters();
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || (maximum && parsed > maximum)) {
    throw invalidParameters();
  }

  return parsed;
};

const parseSearchOptions = (query) => {
  if (typeof query.q !== 'string' || query.q.trim() === '') {
    throw invalidParameters();
  }

  const q = query.q.trim();
  if (q.length > MAX_QUERY_LENGTH) throw invalidParameters();
  query.q = q;

  if (query.page !== undefined) query.page = parsePositiveInteger(query.page);
  if (query.pageSize !== undefined) query.pageSize = parsePositiveInteger(query.pageSize, 100);

  if (query.sortBy !== undefined) {
    if (typeof query.sortBy !== 'string' || !ALLOWED_SORT_BY.has(query.sortBy.trim())) {
      throw invalidParameters();
    }
    query.sortBy = query.sortBy.trim();
  }

  if (query.language !== undefined) {
    const language = typeof query.language === 'string' ? query.language.trim().toLowerCase() : '';
    if (!ALLOWED_LANGUAGES.has(language)) throw invalidParameters();
    query.language = language;
  }
};

/** Validates top-headlines request query parameters. */
export const validateTopHeadlines = (req, res, next) => {
  const allowed = new Set(['category', 'country', 'page', 'pageSize', 'q']);
  rejectUnknownParameters(req.query, allowed);

  const { category, country, page, pageSize, q } = req.query;

  if (category !== undefined) {
    const normalizedCategory = typeof category === 'string' ? category.trim().toLowerCase() : '';
    if (!ALLOWED_CATEGORIES.has(normalizedCategory)) throw invalidParameters();
    req.query.category = normalizedCategory;
  }

  if (country !== undefined) {
    const normalizedCountry = typeof country === 'string' ? country.trim().toLowerCase() : '';
    if (!/^[a-z]{2}$/.test(normalizedCountry)) throw invalidParameters();
    req.query.country = normalizedCountry;
  }

  if (page !== undefined) req.query.page = parsePositiveInteger(page);
  if (pageSize !== undefined) req.query.pageSize = parsePositiveInteger(pageSize, 100);

  if (q !== undefined) {
    if (typeof q !== 'string' || q.trim() === '' || q.trim().length > MAX_QUERY_LENGTH) {
      throw invalidParameters();
    }
    req.query.q = q.trim();
  }

  next();
};

/** Validates search request query parameters. */
export const validateSearch = (req, res, next) => {
  rejectUnknownParameters(
    req.query,
    new Set(['q', 'page', 'pageSize', 'sortBy', 'language'])
  );
  parseSearchOptions(req.query);
  next();
};
