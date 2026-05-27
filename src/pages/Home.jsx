import React from 'react';
import Catagories from '../components/catagories';
import NewsBox from '../components/news-box';
import FavoriteBox from '../components/fav-box';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-gray-950 px-4 md:px-8 py-8">
      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Sidebar - Categories */}
        <div className="xl:col-span-3">
          <div className="sticky top-24">
            <Catagories />
          </div>
        </div>

        {/* Main News Section */}
        <div className="xl:col-span-6">
          <NewsBox />
        </div>

        {/* Right Sidebar - Favorites */}
        <div className="xl:col-span-3">
          <div className="sticky top-24 hidden xl:block">
            <FavoriteBox />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
