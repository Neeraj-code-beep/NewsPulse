import { createHash } from 'node:crypto';
import { getAIConfig } from '../config/ai.js';
import { geminiClient } from '../integrations/ai/gemini.client.js';
import { cacheService } from './cache.service.js';
import { AppError } from '../utils/errors.js';

const validationError = (message = 'Article title and description or content are required.') =>
  new AppError(message, 400, 'AI_VALIDATION_ERROR');

export class AIService {
  constructor({ provider = geminiClient, cache = cacheService, configProvider = getAIConfig } = {}) {
    this.provider = provider;
    this.cache = cache;
    this.configProvider = configProvider;
    this.inFlightRequests = new Map();
  }

  normalizeArticle(article) {
    if (!article || typeof article !== 'object' || Array.isArray(article)) throw validationError();
    const title = typeof article.title === 'string' ? article.title.trim() : '';
    const description = typeof article.description === 'string' ? article.description.trim() : '';
    const content = typeof article.content === 'string' ? article.content.trim() : '';
    if (!title || (!description && !content)) throw validationError();

    const { maxInputLength } = this.configProvider();
    if (title.length > maxInputLength) throw validationError('Article title exceeds the summary input limit.');
    const remaining = maxInputLength - title.length - (description ? 1 : 0);
    if (description.length > remaining) {
      throw validationError('Article description exceeds the summary input limit.');
    }
    const contentBudget = Math.max(0, remaining - description.length - (content ? 1 : 0));
    const safeContent = Array.from(content).slice(0, contentBudget).join('');
    const normalized = { title, description, content: safeContent };
    const text = [title, description, safeContent].filter(Boolean).join('\n');
    if (!text || text.length > maxInputLength) throw validationError();
    return { normalized, text };
  }

  createCacheKey(normalizedArticle) {
    const representation = JSON.stringify({
      title: normalizedArticle.title,
      description: normalizedArticle.description,
      content: normalizedArticle.content
    });
    const hash = createHash('sha256').update(representation).digest('hex');
    return `ai:summary:${hash}`;
  }

  async summarize(article) {
    const { normalized, text } = this.normalizeArticle(article);
    const cacheKey = this.createCacheKey(normalized);
    const cachedSummary = this.cache.get(cacheKey);
    if (cachedSummary) return { summary: cachedSummary, cached: true };

    const existingRequest = this.inFlightRequests.get(cacheKey);
    if (existingRequest) return existingRequest;

    const { cacheTtlMs } = this.configProvider();
    const generation = (async () => {
      try {
        const result = await this.provider.summarize(text);
        const summary = typeof result === 'string' ? result.trim() : '';
        if (!summary) throw new AppError('Unable to generate article summary.', 502, 'AI_GENERATION_FAILED');
        this.cache.set(cacheKey, summary, cacheTtlMs);
        return { summary, cached: false };
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();
    this.inFlightRequests.set(cacheKey, generation);
    return generation;
  }
}

export const aiService = new AIService();
