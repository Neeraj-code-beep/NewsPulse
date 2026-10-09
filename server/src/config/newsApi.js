import { config } from './env.js';
import { AppError } from '../utils/errors.js';

export const newsApiConfig = Object.freeze({
  ...config.newsApi,

  validate() {
    if (!this.apiKey) {
      throw new AppError(
        'NewsAPI key is missing. Please configure NEWS_API_KEY in your server environment.',
        500,
        'NEWS_PROVIDER_CONFIG_ERROR'
      );
    }
  }
});
