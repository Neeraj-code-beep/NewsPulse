import { config } from '../config/env.js';

class CacheService {
  constructor(defaultTtlMs = config.newsApi.cacheTtlMs) {
    this.store = new Map();
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Retrieves a cached item if not expired.
   * @param {string} key
   * @returns {*} Cached value or null
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Sets a value in the cache with a TTL.
   * @param {string} key
   * @param {*} value
   * @param {number} [ttlMs]
   */
  set(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Checks if an unexpired key exists in the cache.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Deletes a key from the cache.
   * @param {string} key
   * @returns {boolean}
   */
  delete(key) {
    return this.store.delete(key);
  }

  /**
   * Clears the entire cache.
   */
  clear() {
    this.store.clear();
  }
}

export const cacheService = new CacheService();
export { CacheService };
