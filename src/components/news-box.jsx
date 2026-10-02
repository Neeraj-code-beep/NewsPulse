import React, { useEffect, useState } from 'react';
import NewsCard from './news-card';
import { Loader, Newspaper, Search, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { auth } from '../../firebase/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import API from '../services/NewsApi.jsx';

function NewsBox() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [text, setText] = useState('');

  async function search() {
    if (!text || text === '') {
      toast.warn('Please enter a search term');
      return;
    }

    try {
      setLoading(true);

      const resp = await API.get(`/news/search?q=${encodeURIComponent(text)}`);

      const data = resp.data?.data || resp.data;

      if (data.status === 'ok' || resp.data?.success) {
        setNews(data.articles || []);
      }
    } catch (error) {
      console.log(error);
      toast.warn('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setUser(user);
        }
      });

      try {
        const resp = await API.get('/news/top-headlines?country=us');

        const data = resp.data?.data || resp.data;

        if (data.status === 'ok' || resp.data?.success) {
          setNews(data.articles || []);
        }
      } catch (error) {
        console.log(error);
        toast.warn('Failed to fetch news');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-gray-950 text-white rounded-3xl border border-white/10 p-6 md:p-10 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center mb-10">
        <div className="flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md mb-5">
          <Sparkles size={16} className="text-cyan-300" />
          <span className="text-sm tracking-wide text-zinc-300">
            Real-Time Headlines
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold flex items-center gap-4">
          <Newspaper size={45} className="text-cyan-300" />

          <span>
            Latest
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              {' '}
              News
            </span>
          </span>
        </h1>

        <p className="text-zinc-400 mt-5 max-w-2xl text-lg">
          Explore trending stories, breaking headlines, and global updates with
          a modern news experience.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-center mb-12">
        <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              size={20}
            />

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search breaking news..."
              className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 outline-none rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 backdrop-blur-lg transition-all duration-300"
            />
          </div>

          <button
            onClick={search}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:scale-105 transition-all duration-300 px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-cyan-500/20"
          >
            Search
          </button>
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="animate-spin text-cyan-300" size={55} />

          <p className="text-zinc-400 mt-5 text-lg">Fetching latest news...</p>
        </div>
      )}

      {/* News Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {news?.map((article, index) => {
            return (
              <div
                key={index}
                className="bg-white/5 border border-white/10 hover:border-cyan-400/40 rounded-3xl overflow-hidden backdrop-blur-lg hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
              >
                <NewsCard news={article} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default NewsBox;
