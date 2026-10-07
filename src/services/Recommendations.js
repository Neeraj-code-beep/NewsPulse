import API from './NewsApi.jsx';

export async function getRelatedNews(article, { limit = 5, signal } = {}) {
  const response = await API.post('/news/related', { article, limit }, { signal });
  return response.data?.data?.articles || [];
}
