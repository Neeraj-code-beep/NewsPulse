const STOP_WORDS = new Set([
  'a', 'about', 'after', 'all', 'also', 'an', 'and', 'are', 'as', 'at', 'be', 'because',
  'been', 'before', 'being', 'between', 'but', 'by', 'can', 'could', 'did', 'do', 'does',
  'during', 'for', 'from', 'had', 'has', 'have', 'he', 'her', 'here', 'hers', 'him', 'his',
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'more', 'most', 'new', 'no', 'not',
  'of', 'on', 'or', 'our', 'out', 'over', 'she', 'so', 'some', 'such', 'than', 'that',
  'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through',
  'to', 'under', 'up', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
  'who', 'will', 'with', 'would', 'you', 'your'
]);

export const normalizeText = (value = '') => String(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim()
  .replace(/\s+/g, ' ');

export const tokenizeText = (value = '') => normalizeText(value)
  .split(' ')
  .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

export const calculateTokenOverlap = (left, right) => {
  const leftTokens = new Set(Array.isArray(left) ? left : tokenizeText(left));
  const rightTokens = new Set(Array.isArray(right) ? right : tokenizeText(right));
  if (!leftTokens.size || !rightTokens.size) return 0;

  let intersection = 0;
  for (const token of leftTokens) if (rightTokens.has(token)) intersection += 1;
  return intersection / (leftTokens.size + rightTokens.size - intersection);
};

export const calculateSimilarity = (left, right) => calculateTokenOverlap(left, right);

export const extractKeywords = (value, limit = 6) => {
  const frequencies = new Map();
  for (const token of tokenizeText(value)) frequencies.set(token, (frequencies.get(token) || 0) + 1);
  return [...frequencies.entries()]
    .sort(([tokenA, countA], [tokenB, countB]) => countB - countA || tokenA.localeCompare(tokenB))
    .slice(0, limit)
    .map(([token]) => token);
};
