import { ArrowLeft, Heart, Loader2, ExternalLink } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  convertISOStringToReadableTime,
  createUniqueIdentifier,
} from '../utils';
import API from '../services/NewsApi.jsx';
import { useFavourites } from '../hooks/useFavourites';

function News() {
  const { newsID } = useParams();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);

        const resp = await API.get(
          `/news/top-headlines?country=us&category=${encodeURIComponent(newsID.toLowerCase())}`,
        );

        const d = resp.data?.data || resp.data;

        if (d.status === 'ok' || resp.data?.success) {
          setNews(d.articles || []);
        }
      } catch (error) {
        console.log(error);
        toast.error('Failed to fetch news');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [newsID, navigate]);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-cyan-400 font-medium hover:text-cyan-300 mb-8 transition"
        >
          <ArrowLeft size={22} />
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

        {loading ? (
          <div className="flex items-center justify-center h-52">
            <Loader2 size={50} className="animate-spin text-cyan-400" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center text-gray-400 text-lg">
            No news articles found.
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((article, index) => (
              <HorNewsCard key={index} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default News;

function HorNewsCard({ article }) {
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
    } catch (error) {
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
    } catch (error) {
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
            alt={article?.title}
            className="w-full h-full object-cover lg:h-[320px] hover:scale-105 transition duration-500"
          />
        </div>

        <div className="flex-1 p-6 lg:p-8 relative">
          {user && (
            <button
              disabled={loading}
              onClick={isFav ? remove_from_fav : add_to_fav}
              className="absolute top-5 right-5 h-12 w-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center hover:scale-110 transition"
            >
              {loading ? (
                <Loader2 size={22} className="animate-spin text-cyan-400" />
              ) : (
                <Heart
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

          <a
            href={article?.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:scale-105 transition"
          >
            Read Full Article
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}
