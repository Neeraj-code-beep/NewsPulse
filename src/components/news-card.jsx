import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

import React, { useEffect, useState } from 'react';

import { Heart, CalendarDays, User, ExternalLink, Loader2 } from 'lucide-react';

import { auth, firestore } from '../../firebase/firebase.config';

import { toast } from 'react-toastify';

import { onAuthStateChanged } from 'firebase/auth';

import {
  convertISOStringToReadableTime,
  createUniqueIdentifier,
} from '../utils';

function NewsCard({ news }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isFav, setIsFav] = useState(false);

  async function add_to_fav() {
    try {
      setLoading(true);

      const ref = doc(firestore, 'favourites', user.uid);

      const docSnap = await getDoc(ref);

      const d = docSnap.data();

      if (d?.favourites?.length > 0) {
        await updateDoc(ref, {
          favourites: arrayUnion({
            id: createUniqueIdentifier(news),
            news: {
              ...news,
            },
          }),
        });
      } else {
        await updateDoc(ref, {
          favourites: [
            {
              id: createUniqueIdentifier(news),
              news: {
                ...news,
              },
            },
          ],
        });
      }

      setIsFav(true);

      toast.success('Added to favourites');
    } catch (error) {
      console.log(error);

      toast.warn('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function remove_from_fav() {
    try {
      setLoading(true);

      const id = createUniqueIdentifier(news);

      const ref = doc(firestore, 'favourites', user.uid);

      await updateDoc(ref, {
        favourites: arrayRemove({
          id: id,
          news: {
            ...news,
          },
        }),
      });

      toast.success('Removed from favourites');

      setIsFav(false);
    } catch (error) {
      toast.warn('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      }
    });
  }, []);

  useEffect(() => {
    (async () => {
      if (!user) return;

      const ref = doc(firestore, 'favourites', user?.uid);

      const data = await getDoc(ref);

      if (data.exists()) {
        const d = data.data();

        if (d.favourites.length > 0) {
          const fav = d.favourites.find(
            (fav) => fav.id === createUniqueIdentifier(news),
          );

          if (fav) {
            setIsFav(true);
          }
        }
      }
    })();
  }, [user]);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black shadow-2xl hover:border-cyan-400/40 transition-all duration-500 hover:-translate-y-1">
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          loading="lazy"
          src={
            news?.urlToImage ||
            'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop'
          }
          alt={news?.title}
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
            disabled={loading}
            onClick={() => {
              isFav ? remove_from_fav() : add_to_fav();
            }}
            className="absolute top-5 right-5 w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:scale-110 transition-all duration-300"
          >
            {loading ? (
              <Loader2 className="animate-spin text-cyan-300" size={20} />
            ) : (
              <Heart
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

        {/* Author + Date */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
              <User size={18} className="text-cyan-300" />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                {news?.author || 'Unknown Author'}
              </p>

              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                <CalendarDays size={13} />
                <span>{convertISOStringToReadableTime(news?.publishedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Read More */}
        <a
          href={news?.url}
          target="_blank"
          rel="noreferrer"
          className="group/link inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 hover:scale-105 transition-all duration-300 px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-cyan-500/20"
        >
          Read Full Article
          <ExternalLink
            size={18}
            className="group-hover/link:translate-x-1 transition-all duration-300"
          />
        </a>
      </div>
    </div>
  );
}

export default NewsCard;
