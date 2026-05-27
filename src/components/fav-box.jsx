import React, { useEffect, useState } from 'react';
import { auth, firestore } from '../../firebase/firebase.config';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, Loader, Trash2, Bookmark, Sparkles } from 'lucide-react';

import {
  arrayRemove,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';

import { onAuthStateChanged } from 'firebase/auth';
import { createUniqueIdentifier } from '../utils';

function FavoriteBox() {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const fetch_fav = async () => {
    if (!user) return;

    const ref = doc(firestore, 'favourites', user.uid);

    const data = await getDoc(ref);

    if (data.exists()) {
      setFavourites(data.data().favourites);
    }

    onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        setFavourites(docSnap.data().favourites);
      }
    });

    setLoading(false);
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      }
    });
  }, []);

  useEffect(() => {
    fetch_fav();
  }, [user]);

  return (
    <div className="bg-gradient-to-br from-black via-zinc-900 to-gray-950 border border-white/10 rounded-3xl p-6 shadow-2xl text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-cyan-300 mb-2">
            <Sparkles size={16} />
            <span className="uppercase tracking-[3px] text-sm font-semibold">
              Saved Articles
            </span>
          </div>

          <h2 className="text-4xl font-extrabold">
            My
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              {' '}
              Favourites
            </span>
          </h2>
        </div>

        <div className="hidden md:flex w-14 h-14 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
          <Heart className="text-red-400" />
        </div>
      </div>

      {user ? (
        <div className="w-full">
          {/* Loader */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader className="animate-spin text-cyan-300" size={45} />

              <p className="text-zinc-400 mt-4">Loading favourites...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && favourites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bookmark size={60} className="text-zinc-600 mb-5" />

              <h3 className="text-2xl font-bold mb-3">No favourites yet</h3>

              <p className="text-zinc-400 max-w-md">
                Save your favourite news articles and they will appear here for
                quick access.
              </p>
            </div>
          )}

          {/* Favourite List */}
          {!loading && favourites.length > 0 && (
            <ul className="space-y-5">
              {favourites.map((news, index) => (
                <ListItem user={user} key={index} art={news.news} />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <Heart size={55} className="mx-auto text-red-400 mb-5" />

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

const ListItem = ({ art, user }) => {
  async function remove_from_fav() {
    try {
      const id = createUniqueIdentifier(art);

      const ref = doc(firestore, 'favourites', user.uid);

      await updateDoc(ref, {
        favourites: arrayRemove({
          id: id,
          news: {
            ...art,
          },
        }),
      });

      toast.success('Removed from favourites');
    } catch (error) {
      toast.warn('Something went wrong');
    }
  }

  return (
    <li className="group bg-white/5 border border-white/10 hover:border-red-400/40 rounded-2xl p-5 flex items-start justify-between gap-5 hover:bg-white/10 transition-all duration-300">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white leading-relaxed group-hover:text-cyan-300 transition-all duration-300">
          {art.title}
        </h3>

        {art.description && (
          <p className="text-zinc-400 mt-2 text-sm line-clamp-2">
            {art.description}
          </p>
        )}
      </div>

      <button
        onClick={() => {
          remove_from_fav();
        }}
        className="bg-red-500/10 hover:bg-red-500 p-3 rounded-xl transition-all duration-300 group/button"
      >
        <Trash2
          size={20}
          className="text-red-400 group-hover/button:text-white"
        />
      </button>
    </li>
  );
};
