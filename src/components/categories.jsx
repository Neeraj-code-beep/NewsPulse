import React from 'react';
import ListItem from './cat-item';
import { Grid2x2, TrendingUp } from 'lucide-react';

const categories = [
  { title: 'Business', id: 1 },
  { title: 'Entertainment', id: 2 },
  { title: 'General', id: 3 },
  { title: 'Health', id: 4 },
  { title: 'Science', id: 5 },
  { title: 'Sports', id: 6 },
  { title: 'Technology', id: 7 },
];

function Categories() {
  return (
    <div className="w-full rounded-3xl border border-cyan-500/10 bg-[#0B0F19] p-6 shadow-[0_0_40px_rgba(0,255,255,0.05)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-3">
            <Grid2x2 size={18} />
            <span className="uppercase tracking-[4px] text-sm font-semibold">
              Explore
            </span>
          </div>

          <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            Main <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Categories
            </span>
          </h2>
        </div>

        <div className="hidden md:flex items-center justify-center w-14 h-14 rounded-2xl border border-cyan-400/20 bg-white/5">
          <TrendingUp className="text-cyan-400" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {categories.map((cat) => (
          <ListItem key={cat.id} cat={cat} />
        ))}
      </div>
    </div>
  );
}

export default Categories;
