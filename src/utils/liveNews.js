export const getLiveArticleIdentities = (article) => {
  const identities = [];
  if (typeof article?.id === 'string' && article.id) identities.push(`id:${article.id}`);
  else if (typeof article?.hash === 'string' && article.hash) identities.push(`id:${article.hash}`);
  if (typeof article?.url === 'string' && article.url.trim()) identities.push(`url:${article.url.trim().toLowerCase()}`);
  return identities;
};

export const getLiveArticleIdentity = (article) => getLiveArticleIdentities(article)[0] || '';

export const deduplicateLiveArticles = (articles = [], seen = new Set()) => {
  const unique = [];
  const identities = new Set(seen);
  for (const article of articles) {
    const articleIdentities = getLiveArticleIdentities(article);
    if (!articleIdentities.length || articleIdentities.some((identity) => identities.has(identity))) continue;
    for (const identity of articleIdentities) identities.add(identity);
    unique.push(article);
  }
  return unique;
};

export const mergeLiveArticles = (currentArticles = [], pendingArticles = []) => {
  const currentIdentities = new Set(currentArticles.flatMap(getLiveArticleIdentities));
  const additions = deduplicateLiveArticles(pendingArticles, currentIdentities)
    .map((article) => ({ ...article, id: article.id || article.hash || undefined }));
  return [...additions, ...currentArticles];
};
