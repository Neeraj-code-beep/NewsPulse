import React from 'react';
import FavoriteBox from '../components/fav-box';

function FavouritesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-gray-950 px-4 py-8 text-white sm:px-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        <FavoriteBox />
      </div>
    </main>
  );
}

export default FavouritesPage;
