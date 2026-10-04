import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, Loader, Trash2, Bookmark, Sparkles } from 'lucide-react';
import { useFavourites } from '../hooks/useFavourites';

function FavoriteBox() {
  const { favourites, loading, authLoading, user, error, removeFavourite } = useFavourites();
  const [removingId, setRemovingId] = useState(null);

  async function removeArticle(article) {
    try {
      setRemovingId(article.id || article.title);
      await removeFavourite(article);
      toast.success('Removed from favourites');
    } catch {
      toast.warn('Something went wrong');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="bg-gradient-to-br from-black via-zinc-900 to-gray-950 border border-white/10 rounded-3xl p-6 shadow-2xl text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-cyan-300 mb-2">
            <Sparkles size={16} aria-hidden="true" />
            <span className="uppercase tracking-[3px] text-sm font-semibold">
              Saved Articles
            </span>
          </div>

          <h2 className="text-3xl font-extrabold sm:text-4xl">
            My
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              {' '}
              Favourites
            </span>
          </h2>
        </div>

        <div className="hidden md:flex w-14 h-14 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
          <Heart className="text-red-400" aria-hidden="true" />
        </div>
      </div>

      {authLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="animate-spin text-cyan-300" size={45} />
          <p className="text-zinc-400 mt-4">Checking your account...</p>
        </div>
      ) : user ? (
        <div className="w-full">
          {/* Loader */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader className="animate-spin text-cyan-300" size={45} />

              <p className="text-zinc-400 mt-4">Loading favourites...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && error && (
            <p role="alert" className="py-8 text-center text-red-300">
              Could not load your favourites. Please try again.
            </p>
          )}

          {!loading && !error && favourites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bookmark size={60} className="text-zinc-600 mb-5" aria-hidden="true" />

              <h3 className="text-2xl font-bold mb-3">No favourites yet</h3>

              <p className="text-zinc-400 max-w-md">
                Save your favourite news articles and they will appear here for
                quick access.
              </p>
            </div>
          )}

          {/* Favourite List */}
          {!loading && !error && favourites.length > 0 && (
            <ul className="space-y-5">
              {favourites.map((favourite, index) => (
                <ListItem
                  key={favourite.id || index}
                  art={favourite.news}
                  loading={removingId === (favourite.news?.id || favourite.news?.title)}
                  onRemove={() => removeArticle(favourite.news)}
                />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <Heart size={55} className="mx-auto text-red-400 mb-5" aria-hidden="true" />

          <h3 className="text-2xl font-bold mb-3">Login Required</h3>

          <p className="text-zinc-400 mb-6">
            You need to login first to access your favourite articles.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-400 hover:scale-105 transition-all duration-300 px-7 py-3 rounded-2xl font-semibold shadow-lg shadow-cyan-500/20"
          >
            Login Now
          </Link>
        </div>
      )}
    </div>
  );
}

export default FavoriteBox;

const ListItem = ({ art, loading, onRemove }) => {
  return (
    <li className="group bg-white/5 border border-white/10 hover:border-red-400/40 rounded-2xl p-5 flex items-start justify-between gap-5 hover:bg-white/10 transition-all duration-300">
      <div className="flex-1">
        <h3 className="text-lg font-semibold leading-relaxed transition-all duration-300">
          {art.url ? (
            <a href={art.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-cyan-200">
              {art.title || 'Untitled article'}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <span className="text-white">{art.title || 'Untitled article'}</span>
          )}
        </h3>

        {art.description && (
          <p className="text-zinc-400 mt-2 text-sm line-clamp-2">
            {art.description}
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={onRemove}
        aria-label={`Remove ${art.title || 'article'} from favourites`}
        aria-busy={loading}
        className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-red-500/10 p-3 transition-all duration-300 group/button hover:bg-red-500 disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? <Loader size={20} className="animate-spin text-red-400" /> : (
          <Trash2 size={20} className="text-red-400 group-hover/button:text-white" aria-hidden="true" />
        )}
      </button>
    </li>
  );
};
