import { liveNewsConfig } from '../config/liveNews.js';
import { generateArticleId } from '../utils/articleHash.js';
import { logger as defaultLogger } from '../utils/logger.js';
import { newsService as defaultNewsService } from './news.service.js';

const normalizeUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value);
    url.hash = '';
    return url.toString();
  } catch {
    return value.trim().toLowerCase();
  }
};

export class LiveNewsService {
  constructor({
    news = defaultNewsService,
    broadcast = () => {},
    config = liveNewsConfig,
    logger = defaultLogger,
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval,
    now = () => new Date()
  } = {}) {
    this.news = news;
    this.broadcast = broadcast;
    this.config = config;
    this.logger = logger;
    this.setIntervalFn = setIntervalFn;
    this.clearIntervalFn = clearIntervalFn;
    this.now = now;
    this.running = false;
    this.timer = null;
    this.pollInProgress = false;
    this.hasBaseline = false;
    this.seenArticles = new Map();
    this.seenUrls = new Map();
    this.lastSuccessfulPoll = null;
    this.lastPollError = null;
  }

  start() {
    if (!this.config.enabled || this.running) return false;
    this.running = true;
    this.timer = this.setIntervalFn(() => { void this.poll(); }, this.config.pollIntervalMs);
    void this.poll();
    return true;
  }

  stop() {
    if (!this.running) return false;
    this.running = false;
    if (this.timer !== null) this.clearIntervalFn(this.timer);
    this.timer = null;
    return true;
  }

  normalizeArticle(article) {
    const normalized = this.news.normalizeArticle?.(article) || article;
    if (!normalized || typeof normalized.title !== 'string' || !normalized.title.trim()) return null;
    const url = normalizeUrl(normalized.url);
    if (!url) return null;
    const hash = normalized.id || generateArticleId(normalized);
    return { ...normalized, id: hash, url, _urlKey: url };
  }

  remember(article) {
    const hash = article.id || generateArticleId(article);
    const url = article._urlKey || normalizeUrl(article.url);
    const key = hash || (url ? `url:${url}` : '');
    if (!key) return false;
    if (this.seenArticles.has(key) || (url && this.seenUrls.has(url))) return false;

    this.seenArticles.set(key, url);
    if (url) this.seenUrls.set(url, key);
    while (this.seenArticles.size > this.config.seenLimit) {
      const oldestKey = this.seenArticles.keys().next().value;
      const oldestUrl = this.seenArticles.get(oldestKey);
      if (oldestUrl) this.seenUrls.delete(oldestUrl);
      this.seenArticles.delete(oldestKey);
    }
    return true;
  }

  toEventArticle(article) {
    return {
      title: article.title,
      description: article.description || null,
      url: article.url,
      source: { name: article.source?.name || 'Unknown' },
      publishedAt: article.publishedAt || null,
      image: article.urlToImage || null,
      hash: article.id
    };
  }

  async poll() {
    if (!this.running || this.pollInProgress) return false;
    this.pollInProgress = true;
    try {
      const response = await this.news.getTopHeadlines({
        country: 'us',
        page: 1,
        pageSize: this.config.pageSize
      });
      if (!this.running) return false;

      const articles = (Array.isArray(response?.articles) ? response.articles : [])
        .map((article) => this.normalizeArticle(article))
        .filter(Boolean);

      if (!this.hasBaseline) {
        for (const article of articles) this.remember(article);
        this.hasBaseline = true;
      } else {
        const newlyDetected = articles.filter((article) => this.remember(article));
        if (newlyDetected.length) {
          try {
            this.broadcast({
              articles: newlyDetected.map((article) => this.toEventArticle(article)),
              fetchedAt: this.now().toISOString()
            });
          } catch {
            for (const article of newlyDetected) this.forget(article);
            this.logger.error('Live news broadcast failed; the next poll will retry.');
          }
        }
      }

      this.lastSuccessfulPoll = this.now().toISOString();
      this.lastPollError = null;
      return true;
    } catch (error) {
      this.lastPollError = typeof error?.code === 'string' ? error.code : 'LIVE_NEWS_POLL_FAILED';
      this.logger.error('Live news poll failed; the next scheduled poll will retry.', this.lastPollError);
      return false;
    } finally {
      this.pollInProgress = false;
    }
  }

  forget(article) {
    const key = article.id || generateArticleId(article);
    const url = article._urlKey || normalizeUrl(article.url);
    this.seenArticles.delete(key);
    if (url && this.seenUrls.get(url) === key) this.seenUrls.delete(url);
  }
}

export const liveNewsService = new LiveNewsService();
