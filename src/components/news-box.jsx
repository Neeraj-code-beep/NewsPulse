import React, { useEffect, useRef, useState } from 'react';
import NewsCard from './news-card';
import { Loader, Newspaper, Search, Sparkles } from 'lucide-react';
import API from '../services/NewsApi.jsx';
import { createUniqueIdentifier } from '../utils';

const SEARCH_DEBOUNCE_MS = 400;

function NewsBox() {
  const [articles, setArticles] = useState([]);
  const [status, setStatus] = useState('loading');
  const [text, setText] = useState('');
  const [searchAttempt, setSearchAttempt] = useState(0);
  const immediateSearchRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let debounceTimer;
    const query = text.trim();

    const loadArticles = async (url) => {
      try {
        const response = await API.get(url, { signal: controller.signal });
        if (!active) return;

        const data = response.data?.data || response.data;
        if (data.status !== 'ok' && !response.data?.success) {
          throw new Error('Unexpected news response');
        }

        const nextArticles = Array.isArray(data.articles) ? data.articles : [];
        setArticles(nextArticles);
        setStatus(nextArticles.length ? 'success' : 'empty');
      } catch (error) {
        if (!active || error.code === 'ERR_CANCELED' || error.name === 'CanceledError') return;
        setArticles([]);
        setStatus('error');
      }
    };

    if (!query) {
      setStatus('loading');
      loadArticles('/news/top-headlines?country=us');
    } else if (query.length < 2) {
      immediateSearchRef.current = false;
      setArticles([]);
      setStatus('idle');
    } else {
      setArticles([]);
      setStatus('loading');
      const delay = immediateSearchRef.current ? 0 : SEARCH_DEBOUNCE_MS;
      immediateSearchRef.current = false;
      debounceTimer = window.setTimeout(() => {
        loadArticles(`/news/search?q=${encodeURIComponent(query)}`);
      }, delay);
    }

    return () => {
      active = false;
      window.clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [text, searchAttempt]);

  function submitSearch(event) {
    event.preventDefault();
    const query = text.trim();
    if (!query) {
      immediateSearchRef.current = true;
      setSearchAttempt((attempt) => attempt + 1);
      return;
    }
    if (query.length < 2) {
      setStatus('idle');
      return;
    }
    immediateSearchRef.current = true;
    setSearchAttempt((attempt) => attempt + 1);
  }

  return (
    <section aria-labelledby="latest-news-heading" className="min-h-screen rounded-3xl border border-white/10 bg-gradient-to-br from-black via-zinc-900 to-gray-950 p-4 text-white shadow-2xl sm:p-6 md:p-10">
      <div className="mb-10 flex flex-col items-center justify-center text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md">
          <Sparkles size={16} className="text-cyan-300" aria-hidden="true" />
          <span className="text-sm tracking-wide text-zinc-300">Real-Time Headlines</span>
        </div>

        <h1 id="latest-news-heading" className="flex items-center gap-3 text-4xl font-extrabold sm:text-5xl md:gap-4 md:text-6xl">
          <Newspaper size={36} className="shrink-0 text-cyan-300 sm:h-11 sm:w-11" aria-hidden="true" />
          <span>
            Latest
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"> News</span>
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-base text-zinc-300 sm:text-lg">
          Explore trending stories, breaking headlines, and global updates with a modern news experience.
        </p>
      </div>

      <form onSubmit={submitSearch} role="search" className="mb-10 flex justify-center sm:mb-12">
        <div className="flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="news-search" className="sr-only">Search news articles</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} aria-hidden="true" />
            <input
              id="news-search"
              type="search"
              value={text}
              maxLength={500}
              autoComplete="off"
              onChange={(event) => setText(event.target.value)}
              placeholder="Search breaking news..."
              className="w-full rounded-2xl border border-white/20 bg-white/5 py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-400 transition-colors focus:border-cyan-300 backdrop-blur-lg sm:py-4"
            />
          </div>

          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-8 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02]"
          >
            <Search size={18} aria-hidden="true" />
            Search
          </button>
        </div>
      </form>

      {status === 'loading' && (
        <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-16">
          <Loader className="animate-spin text-cyan-300" size={48} aria-hidden="true" />
          <p className="mt-5 text-lg text-zinc-300">{text.trim() ? 'Searching news…' : 'Fetching latest news…'}</p>
        </div>
      )}

      {status === 'idle' && (
        <p role="status" aria-live="polite" className="py-10 text-center text-zinc-300">
          Enter at least two characters to search for news.
        </p>
      )}

      {status === 'error' && (
        <div role="alert" className="rounded-2xl border border-red-300/20 bg-red-950/30 px-5 py-8 text-center">
          <p className="text-red-100">News could not be loaded. Check your connection and try again.</p>
          <button
            type="button"
            onClick={submitSearch}
            className="mt-4 min-h-11 rounded-xl border border-red-200/30 px-5 py-2 font-semibold text-white hover:bg-red-100/10"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'empty' && (
        <div className="py-12 text-center">
          <p className="text-lg font-semibold text-white">{text.trim() ? 'No articles matched that search.' : 'No headlines are available right now.'}</p>
          <p className="mt-2 text-zinc-300">{text.trim() ? 'Try a different search phrase.' : 'Please check back shortly.'}</p>
        </div>
      )}

      {status === 'success' && (
        <div role="region" aria-label={text.trim() ? 'Search results' : 'Latest headlines'} className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {articles.map((article) => (
            <div
              key={article.id || createUniqueIdentifier(article)}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg transition-colors hover:border-cyan-400/40 hover:bg-white/10"
            >
              <NewsCard news={article} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default NewsBox;
