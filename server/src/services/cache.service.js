import { config } from '../config/env.js';

class CacheService {
  constructor(defaultTtlMs = config.newsApi.cacheTtlMs, maxEntries = config.cacheMaxEntries) {
    this.store = new Map();
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
  }

  removeExpired(now = Date.now()) {
    for (const [key, entry] of this.store) {
      if (now >= entry.expiresAt) this.store.delete(key);
    }
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
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  /**
   * Sets a value in the cache with a TTL.
   * @param {string} key
   * @param {*} value
   * @param {number} [ttlMs]
   */
  set(key, value, ttlMs = this.defaultTtlMs) {
    if (typeof key !== 'string' || !key || key.length > 4_096) throw new TypeError('Cache keys must be non-empty strings of at most 4096 characters.');
    if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) throw new RangeError('Cache TTL must be a positive safe integer.');
    if (!Number.isSafeInteger(this.maxEntries) || this.maxEntries < 1) throw new RangeError('Cache capacity must be a positive safe integer.');
    const now = Date.now();
    this.removeExpired(now);
    const expiresAt = now + ttlMs;
    this.store.delete(key);
    this.store.set(key, { value, expiresAt });
    while (this.store.size > this.maxEntries) this.store.delete(this.store.keys().next().value);
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
