import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { generateArticleId } from '../utils/articleHash.js';
import { calculateTokenOverlap, tokenizeText } from '../utils/textSimilarity.js';
import { cacheService } from './cache.service.js';
import { newsService } from './news.service.js';

const SCORE_WEIGHTS = Object.freeze({ title: 0.65, description: 0.2, content: 0.1, keywords: 0.05 });
const MIN_SCORE = 0.14;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;
const MAX_QUERY_LENGTH = 120;
const ALGORITHM_VERSION = 'v1';

const text = (value) => typeof value === 'string' ? value : '';
const sourceName = (article) => text(article?.source?.name || article?.source);
const articleUrl = (article) => text(article?.url).trim().toLowerCase();
const fallbackIdentity = (article) => `${text(article?.title).trim().toLowerCase()}|${sourceName(article).trim().toLowerCase()}`;
const normalizedArticle = (article) => ({
  id: article?.id || generateArticleId(article),
  title: text(article?.title),
  description: article?.description || null,
  content: article?.content || null,
  author: article?.author || null,
  source: {
    id: article?.source?.id || null,
    name: sourceName(article) || 'Unknown'
  },
  url: article?.url || null,
  urlToImage: article?.urlToImage || null,
  publishedAt: article?.publishedAt || null
});

const recencyBoost = (publishedAt, now) => {
  const timestamp = Date.parse(publishedAt || '');
  if (!Number.isFinite(timestamp) || timestamp > now) return 0;
  const ageDays = (now - timestamp) / 86_400_000;
  return Math.max(0, 1 - ageDays / 30) * 0.02;
};

export const scoreArticleSimilarity = (current, candidate, now = Date.now()) => {
  const currentTitle = tokenizeText(current.title);
  const currentDescription = tokenizeText(current.description || '');
  const currentContent = tokenizeText(current.content || '');
  const candidateTitle = tokenizeText(candidate.title);
  const candidateDescription = tokenizeText(candidate.description || '');
  const candidateContent = tokenizeText(candidate.content || '');
  const currentKeywords = tokenizeText(`${current.title} ${current.description || ''} ${current.content || ''}`);
  const candidateKeywords = tokenizeText(`${candidate.title} ${candidate.description || ''} ${candidate.content || ''}`);

  const contentScore = calculateTokenOverlap(currentTitle, candidateTitle) * SCORE_WEIGHTS.title
    + calculateTokenOverlap(currentDescription, candidateDescription) * SCORE_WEIGHTS.description
    + calculateTokenOverlap(currentContent, candidateContent) * SCORE_WEIGHTS.content
    + calculateTokenOverlap(currentKeywords, candidateKeywords) * SCORE_WEIGHTS.keywords;
  const sourceScore = sourceName(current) && sourceName(current).toLowerCase() === sourceName(candidate).toLowerCase() ? 0.02 : 0;
  return Math.min(1, contentScore + sourceScore + recencyBoost(candidate.publishedAt, now));
};

export class RecommendationService {
  constructor({ news = newsService, cache = cacheService, now = () => Date.now() } = {}) {
    this.news = news;
    this.cache = cache;
    this.now = now;
    this.inFlightRequests = new Map();
  }

  buildQuery(article) {
    const titleTokens = tokenizeText(article.title);
    const descriptionTokens = tokenizeText(article.description || '');
    const weights = new Map();
    for (const token of titleTokens) weights.set(token, (weights.get(token) || 0) + 2);
    for (const token of descriptionTokens) weights.set(token, (weights.get(token) || 0) + 1);
    const keywords = [...weights.entries()]
      .sort(([tokenA, scoreA], [tokenB, scoreB]) => scoreB - scoreA || tokenA.localeCompare(tokenB))
      .slice(0, 6)
      .map(([token]) => token);
    let query = '';
    for (const keyword of keywords) {
      const next = query ? `${query} ${keyword}` : keyword;
      if (next.length > MAX_QUERY_LENGTH) break;
      query = next;
    }
    return query;
  }

  deduplicateAndExclude(current, candidates) {
    const currentId = generateArticleId(current);
    const currentUrl = articleUrl(current);
    const currentFallback = fallbackIdentity(current);
    const seenIds = new Set();
    const seenUrls = new Set();
    const seenFallbacks = new Set();
    const unique = [];

    for (const raw of candidates) {
      const candidate = normalizedArticle(raw);
      const id = candidate.id || generateArticleId(candidate);
      const url = articleUrl(candidate);
      const fallback = fallbackIdentity(candidate);
      if (id === currentId || (currentUrl && url === currentUrl) || (fallback !== '|' && fallback === currentFallback)) continue;
      if ((id && seenIds.has(id)) || (url && seenUrls.has(url)) || (fallback !== '|' && seenFallbacks.has(fallback))) continue;
      if (id) seenIds.add(id);
      if (url) seenUrls.add(url);
      if (fallback !== '|') seenFallbacks.add(fallback);
      unique.push(candidate);
    }
    return unique;
  }

  createCacheKey(article, limit) {
    return `related:${ALGORITHM_VERSION}:${generateArticleId(article)}:${limit}`;
  }

  async getRelatedNews(article, limit = DEFAULT_LIMIT) {
    const boundedLimit = Math.max(1, Math.min(MAX_LIMIT, Number(limit) || DEFAULT_LIMIT));
    const cacheKey = this.createCacheKey(article, boundedLimit);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    if (this.inFlightRequests.has(cacheKey)) return this.inFlightRequests.get(cacheKey);

    const request = (async () => {
      try {
        const query = this.buildQuery(article);
        if (!query) return { articles: [] };
        let response;
        try {
          response = await this.news.searchNews({ q: query, page: 1, pageSize: 50, sortBy: 'publishedAt' });
        } catch {
          throw new AppError('Related stories are temporarily unavailable.', 502, 'RECOMMENDATION_PROVIDER_ERROR');
        }
        const candidates = this.deduplicateAndExclude(article, response?.articles || []);
        const now = this.now();
        const articles = candidates
          .map((candidate) => ({ candidate, score: scoreArticleSimilarity(article, candidate, now) }))
          .filter(({ score }) => score >= MIN_SCORE)
          .sort((a, b) => b.score - a.score || Date.parse(b.candidate.publishedAt || '') - Date.parse(a.candidate.publishedAt || ''))
          .slice(0, boundedLimit)
          .map(({ candidate, score }) => ({
            id: candidate.id,
            title: candidate.title,
            description: candidate.description,
            url: candidate.url,
            source: candidate.source,
            publishedAt: candidate.publishedAt,
            urlToImage: candidate.urlToImage,
            score: Number(score.toFixed(3))
          }));
        const result = { articles };
        this.cache.set(cacheKey, result, config.newsApi.cacheTtlMs);
        return result;
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    this.inFlightRequests.set(cacheKey, request);
    return request;
  }
}

export const recommendationService = new RecommendationService();
