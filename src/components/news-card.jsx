import React, { useState } from 'react';

import { Heart, CalendarDays, User, ExternalLink, Loader2 } from 'lucide-react';

import { toast } from 'react-toastify';
import { useFavourites } from '../hooks/useFavourites';
import ArticleSummaryAction from './ArticleSummaryAction';

import {
  convertISOStringToReadableTime,
  createUniqueIdentifier,
} from '../utils';

function NewsCard({ news }) {
  const [loading, setLoading] = useState(false);
  const { user, favourites, addFavourite, removeFavourite } = useFavourites();
  const articleId = createUniqueIdentifier(news);
  const isFav = favourites.some((favourite) => favourite.id === articleId);

  async function toggleFavourite() {
    if (!user) {
      toast.warning('Please login first');
      return;
    }

    try {
      setLoading(true);
      if (isFav) {
        await removeFavourite(news);
        toast.success('Removed from favourites');
      } else {
        await addFavourite(news);
        toast.success('Added to favourites');
      }
    } catch (error) {
      toast.warn('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black shadow-2xl hover:border-cyan-400/40 transition-all duration-500 hover:-translate-y-1">
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          loading="lazy"
          decoding="async"
          src={
            news?.urlToImage ||
            'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop'
          }
          alt={news?.title ? `Article image: ${news.title}` : ''}
          className="w-full h-72 object-cover group-hover:scale-105 transition-all duration-700"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

        {/* Category */}
        <div className="absolute top-5 left-5">
          <span className="bg-cyan-400/20 border border-cyan-300/20 backdrop-blur-xl text-cyan-300 text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-wider">
            Breaking News
          </span>
        </div>

        {/* Favourite Button */}
        {user && (
          <button
            type="button"
            disabled={loading}
            onClick={toggleFavourite}
            aria-label={`${isFav ? 'Remove' : 'Add'} ${news?.title || 'article'} ${isFav ? 'from' : 'to'} favourites`}
            aria-pressed={isFav}
            aria-busy={loading}
            className="absolute right-5 top-5 inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl transition-transform hover:scale-105"
          >
            {loading ? (
              <Loader2 className="animate-spin text-cyan-300" size={20} />
            ) : (
              <Heart
                aria-hidden="true"
                size={22}
                className={`transition-all duration-300 ${
                  isFav
                    ? 'fill-red-500 text-red-500'
                    : 'text-white hover:fill-red-500 hover:text-red-500'
                }`}
              />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-7">
        {/* Title */}
        <h2 className="text-2xl font-bold text-white leading-snug mb-4 group-hover:text-cyan-300 transition-all duration-300 line-clamp-2">
          {news?.title}
        </h2>

        {/* Description */}
        <p className="text-zinc-400 leading-relaxed mb-6 line-clamp-3">
          {news?.description || 'No description available.'}
        </p>

        <ArticleSummaryAction article={news} />

        {/* Author + Date */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
              <User size={18} className="text-cyan-300" aria-hidden="true" />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                {news?.author || 'Unknown Author'}
              </p>

              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                <CalendarDays size={13} aria-hidden="true" />
                <span>{convertISOStringToReadableTime(news?.publishedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Read More */}
        <a
          href={news?.url}
          target="_blank"
          className="group/link inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-3 font-semibold shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.02]"
          rel="noopener noreferrer"
        >
          Read Full Article
          <ExternalLink
            size={18}
            aria-hidden="true"
            className="group-hover/link:translate-x-1 transition-all duration-300"
          />
        </a>
      </div>
    </div>
  );
}

export default NewsCard;
