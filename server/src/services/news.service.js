import { newsApiClient } from '../integrations/newsapi/newsapi.client.js';
import { cacheService } from './cache.service.js';
import { generateArticleId } from '../utils/articleHash.js';
import { logger } from '../utils/logger.js';

class NewsService {
  constructor({ client = newsApiClient, cache = cacheService, logger: serviceLogger = logger } = {}) {
    this.client = client;
    this.cache = cache;
    this.logger = serviceLogger;
    this.inFlightRequests = new Map();
  }

  /**
   * Generates a deterministic cache key for query parameters.
   * @param {string} prefix
   * @param {Object} params
   * @returns {string}
   */
  generateCacheKey(prefix, params = {}) {
    const sortedEntries = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k.toLowerCase(), String(v).trim()])
      .sort(([a], [b]) => a.localeCompare(b));

    const paramString = sortedEntries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    return `news:${prefix}:${paramString}`;
  }

  /**
   * Normalizes a single article object.
   * @param {Object} article
   * @returns {Object}
   */
  normalizeArticle(article) {
    if (!article || typeof article !== 'object') return null;

    return {
      id: generateArticleId(article),
      source: {
        id: article.source?.id || null,
        name: article.source?.name || 'Unknown'
      },
      author: article.author || null,
      title: article.title || 'Untitled',
      description: article.description || null,
      url: article.url || null,
      urlToImage: article.urlToImage || null,
      publishedAt: article.publishedAt || null,
      content: article.content || null
    };
  }

  /**
   * Normalizes a raw NewsAPI response.
   * @param {Object} rawData
   * @param {number} page
   * @param {number} pageSize
   * @returns {Object}
   */
  normalizeResponse(rawData, page = 1, pageSize = 20) {
    const rawArticles = Array.isArray(rawData?.articles) ? rawData.articles : [];
    const articles = rawArticles
      .map((art) => this.normalizeArticle(art))
      .filter(Boolean);

    const normalized = {
      status: 'ok',
      page: Number(page),
      pageSize: Number(pageSize),
      articles
    };

    if (rawData?.totalResults !== undefined && rawData?.totalResults !== null) {
      normalized.totalResults = rawData.totalResults;
    }

    return normalized;
  }

  /**
   * Executes a cached or deduplicated request.
   * @param {string} cacheKey
   * @param {Function} fetcher
   * @returns {Promise<Object>}
   */
  async executeWithCache(cacheKey, fetcher, page, pageSize) {
    // 1. Check cache
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // 2. Check in-flight requests (cache stampede protection)
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey);
    }

    // 3. Initiate request with deduplication
    const fetchPromise = (async () => {
      try {
        const rawData = await fetcher();
        const normalized = this.normalizeResponse(rawData, page, pageSize);

        // Cache successful response only
        this.cache.set(cacheKey, normalized);
        return normalized;
      } finally {
        // Always cleanup in-flight map
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    this.inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Retrieves top headlines with caching and deduplication.
   * @param {Object} queryParams
   * @returns {Promise<Object>}
   */
  async getTopHeadlines(queryParams = {}) {
    const { country = 'us', category, page = 1, pageSize = 20, q } = queryParams;

    const requestParams = {
      country,
      ...(category ? { category } : {}),
      ...(q ? { q } : {}),
      page,
      pageSize
    };

    const cacheKey = this.generateCacheKey('top-headlines', requestParams);

    return this.executeWithCache(
      cacheKey,
      () => this.client.getTopHeadlines(requestParams),
      page,
      pageSize
    );
  }

  /**
   * Searches news articles with caching and deduplication.
   * @param {Object} queryParams
   * @returns {Promise<Object>}
   */
  async searchNews(queryParams = {}) {
    const { q, page = 1, pageSize = 20, sortBy = 'publishedAt', language } = queryParams;

    const requestParams = {
      q,
      ...(language ? { language } : {}),
      sortBy,
      page,
      pageSize
    };

    const cacheKey = this.generateCacheKey('search', requestParams);

    return this.executeWithCache(
      cacheKey,
      () => this.client.search(requestParams),
      page,
      pageSize
    );
  }
}

export const newsService = new NewsService();
export { NewsService };
