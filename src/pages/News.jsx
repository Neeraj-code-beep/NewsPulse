import { ArrowLeft, Heart, Loader2, ExternalLink } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  convertISOStringToReadableTime,
  createUniqueIdentifier,
} from '../utils';
import API from '../services/NewsApi.jsx';
import { useFavourites } from '../hooks/useFavourites';
import ArticleSummaryAction from '../components/ArticleSummaryAction';

function News() {
  const { newsID } = useParams();

  const [news, setNews] = useState([]);
  const [status, setStatus] = useState('loading');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const fetchNews = async () => {
      try {
        const response = await API.get(
          `/news/top-headlines?country=us&category=${encodeURIComponent(newsID.toLowerCase())}`,
          { signal: controller.signal }
        );

        if (!active) return;
        const data = response.data?.data || response.data;
        if (data.status !== 'ok' && !response.data?.success) throw new Error('Unexpected news response');

        const articles = Array.isArray(data.articles) ? data.articles : [];
        setNews(articles);
        setStatus(articles.length ? 'success' : 'empty');
      } catch (error) {
        if (!active || error.code === 'ERR_CANCELED' || error.name === 'CanceledError') return;
        setNews([]);
        setStatus('error');
      }
    };

    fetchNews();
    return () => {
      active = false;
      controller.abort();
    };
  }, [newsID, retryCount]);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-cyan-400 font-medium hover:text-cyan-300 mb-8 transition"
        >
          <ArrowLeft size={22} aria-hidden="true" />
          Back to Home
        </Link>

        <div className="mb-10">
          <p className="uppercase tracking-[0.3em] text-cyan-400 text-sm mb-2">
            Explore
          </p>

          <h1 className="text-4xl md:text-5xl font-bold capitalize">
            {newsID}{' '}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              News
            </span>
          </h1>
        </div>

        {status === 'loading' ? (
          <div role="status" aria-live="polite" className="flex h-52 flex-col items-center justify-center gap-4">
            <Loader2 size={44} className="animate-spin text-cyan-300" aria-hidden="true" />
            <p className="text-zinc-300">Loading {newsID} headlines…</p>
          </div>
        ) : status === 'error' ? (
          <div role="alert" className="rounded-2xl border border-red-300/20 bg-red-950/30 px-5 py-8 text-center">
            <p className="text-red-100">These headlines could not be loaded. Please try again.</p>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-4 min-h-11 rounded-xl border border-red-200/30 px-5 py-2 font-semibold text-white hover:bg-red-100/10">
              Try again
            </button>
          </div>
        ) : status === 'empty' ? (
          <div className="py-10 text-center text-zinc-300" role="status">
            No news articles found.
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((article, index) => (
              <HorNewsCard key={article.id || createUniqueIdentifier(article)} article={article} loading={index > 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default News;

function HorNewsCard({ article, loading: lazyLoadImage }) {
  const [loading, setLoading] = useState(false);
  const { user, favourites, addFavourite, removeFavourite } = useFavourites();
  const articleId = createUniqueIdentifier(article);
  const isFav = favourites.some((favourite) => favourite.id === articleId);

  async function add_to_fav() {
    if (!user) {
      toast.warning('Please login first');
      return;
    }

    try {
      setLoading(true);

      await addFavourite(article);

      toast.success('Added to favourites');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function remove_from_fav() {
    try {
      setLoading(true);

      await removeFavourite(article);

      toast.success('Removed from favourites');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#111111] to-[#050816] shadow-2xl hover:border-cyan-400/40 transition duration-300">
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-[35%] overflow-hidden">
          <img
            src={
              article?.urlToImage ||
              'https://via.placeholder.com/400x250?text=No+Image'
            }
            alt={article?.title || ''}
            loading={lazyLoadImage ? 'lazy' : 'eager'}
            decoding="async"
            className="h-64 w-full object-cover transition duration-500 hover:scale-105 sm:h-72 lg:h-[320px]"
          />
        </div>

        <div className="flex-1 p-6 lg:p-8 relative">
          {user && (
            <button
              type="button"
              disabled={loading}
              onClick={isFav ? remove_from_fav : add_to_fav}
              aria-label={`${isFav ? 'Remove from' : 'Add to'} favourites: ${article?.title || 'article'}`}
              aria-pressed={isFav}
              aria-busy={loading}
              className="absolute top-5 right-5 h-12 w-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center hover:scale-110 transition"
            >
              {loading ? (
                <Loader2 size={22} className="animate-spin text-cyan-400" />
              ) : (
                <Heart
                  aria-hidden="true"
                  size={24}
                  className={`transition ${
                    isFav
                      ? 'fill-red-500 text-red-500'
                      : 'text-white hover:text-red-500 hover:fill-red-500'
                  }`}
                />
              )}
            </button>
          )}

          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs uppercase tracking-wider">
              Trending
            </span>

            <span className="text-sm text-gray-400">
              {convertISOStringToReadableTime(article?.publishedAt)}
            </span>
          </div>

          <p className="text-sm font-medium text-gray-400 capitalize mb-4">
            {article?.author || 'Unknown Author'}
          </p>

          <h2 className="text-2xl lg:text-3xl font-bold leading-tight mb-4 text-white">
            {article?.title}
          </h2>

          <p className="text-gray-300 leading-relaxed mb-6">
            {article?.description}
          </p>

          <ArticleSummaryAction article={article} />

          <a
            href={article?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:scale-105 transition"
          >
            Read Full Article
            <ExternalLink size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
