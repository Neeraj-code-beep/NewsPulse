import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowRight, Newspaper } from 'lucide-react';

function AboutPage() {
  const handleButtonClick = () => {
    toast.info('Thanks for visiting our About Us page!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-gray-950 text-white px-6 py-16">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
        {/* Left Content */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
            <Newspaper size={18} />
            <span className="text-sm tracking-wide">Trusted News Platform</span>
          </div>

          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Stay Updated With
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                {' '}
                Real-Time News
              </span>
            </h1>

            <p className="text-zinc-300 text-lg leading-relaxed max-w-xl">
              Welcome to our modern news platform where technology meets
              journalism. We bring you the latest headlines, trending stories,
              and verified updates from around the world with a smooth and
              engaging reading experience.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-lg">
              <h2 className="text-3xl font-bold text-blue-400">24/7</h2>
              <p className="text-sm text-zinc-400 mt-1">Live Updates</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-lg">
              <h2 className="text-3xl font-bold text-cyan-400">100+</h2>
              <p className="text-sm text-zinc-400 mt-1">Daily Articles</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-lg">
              <h2 className="text-3xl font-bold text-purple-400">50K+</h2>
              <p className="text-sm text-zinc-400 mt-1">Readers</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleButtonClick}
              className="group bg-gradient-to-r from-blue-500 to-cyan-400 hover:scale-105 transition-all duration-300 px-7 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              Learn More
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-all"
              />
            </button>

            <Link
              to="/"
              className="border border-white/20 hover:bg-white/10 transition-all duration-300 px-7 py-3 rounded-xl font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>

          <img
            src="https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200&auto=format&fit=crop"
            alt="Newspapers spread across a table"
            decoding="async"
            className="relative z-10 rounded-3xl shadow-2xl border border-white/10 object-cover w-full h-[500px]"
          />

          {/* Floating Card */}
          <div className="absolute -bottom-6 -left-6 bg-zinc-900/90 border border-white/10 backdrop-blur-xl p-5 rounded-2xl shadow-2xl z-20 w-64">
            <p className="text-sm text-zinc-400 mb-2">Breaking News</p>
            <h3 className="font-semibold text-lg leading-snug">
              Delivering accurate and fast journalism worldwide.
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
