const DEFAULTS = Object.freeze({ enabled: true, pollIntervalMs: 900_000, pageSize: 20, seenLimit: 500 });
const bounded = (value, fallback, minimum, maximum) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
};
export const getLiveNewsConfig = (env = process.env) => Object.freeze({
  enabled: !['false', '0', 'no'].includes(String(env.LIVE_NEWS_ENABLED ?? 'true').trim().toLowerCase()),
  pollIntervalMs: bounded(env.LIVE_NEWS_POLL_INTERVAL_MS, DEFAULTS.pollIntervalMs, 60_000, 3_600_000),
  pageSize: bounded(env.LIVE_NEWS_PAGE_SIZE, DEFAULTS.pageSize, 1, 50),
  seenLimit: bounded(env.LIVE_NEWS_SEEN_LIMIT, DEFAULTS.seenLimit, 50, 5_000)
});
export const liveNewsConfig = getLiveNewsConfig();
