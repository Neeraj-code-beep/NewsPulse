import { newsApiConfig } from '../../config/newsApi.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const TIMEOUT_MS = 10000;

class NewsApiClient {
  constructor({
    apiConfig = newsApiConfig,
    fetchImpl = (...args) => fetch(...args),
    timeoutMs = TIMEOUT_MS,
    logger: clientLogger = logger
  } = {}) {
    this.apiConfig = apiConfig;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.logger = clientLogger;
  }

  /**
   * Fetches data from NewsAPI endpoint.
   * @param {string} endpoint - e.g. '/top-headlines' or '/everything'
   * @param {Record<string, string|number>} params
   * @returns {Promise<Object>}
   */
  async request(endpoint, params = {}) {
    this.apiConfig.validate();

    const url = new URL(`${this.apiConfig.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url.toString(), {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiConfig.apiKey,
          Accept: 'application/json'
        },
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const status = response.status;
        this.logger.error(`NewsAPI request failed with HTTP ${status}`);

        if (status === 401) {
          throw new AppError('News provider authentication failed.', 500, 'NEWS_PROVIDER_UNAUTHORIZED');
        }
        if (status === 429) {
          throw new AppError('News provider rate limit exceeded.', 429, 'NEWS_PROVIDER_RATE_LIMITED');
        }
        if (status >= 500) {
          throw new AppError('News provider service is temporarily unavailable.', 502, 'NEWS_PROVIDER_UNAVAILABLE');
        }

        throw new AppError('News provider rejected the request.', status, 'NEWS_PROVIDER_ERROR');
      }

      if (data.status !== 'ok') {
        throw new AppError('News provider returned an invalid response.', 502, 'NEWS_PROVIDER_ERROR');
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        this.logger.error(`NewsAPI request timed out after ${this.timeoutMs}ms`);
        throw new AppError('News provider request timed out', 504, 'NEWS_PROVIDER_TIMEOUT');
      }

      this.logger.error('NewsAPI network error');
      throw new AppError('Failed to connect to news provider.', 502, 'NEWS_PROVIDER_UNAVAILABLE');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetches top headlines from NewsAPI.
   * @param {Object} params
   */
  async getTopHeadlines(params) {
    return this.request('/top-headlines', params);
  }

  /**
   * Searches news articles from NewsAPI /everything endpoint.
   * @param {Object} params
   */
  async search(params) {
    return this.request('/everything', params);
  }
}

export const newsApiClient = new NewsApiClient();
export { NewsApiClient };
