import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ListItem({ cat }) {
  return (
    <Link to={`/news/${cat.title.toLowerCase()}`} className="block">
      <div className="group relative overflow-hidden rounded-2xl border border-cyan-500/10 bg-[#111827] p-5 transition-all duration-300 hover:border-cyan-400/40 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]">
        {/* Glow */}
        <div className="absolute top-0 right-0 h-24 w-24 bg-cyan-400/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Icon */}
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
          <ArrowUpRight
            size={26}
            className="text-cyan-300 transition-transform duration-300 group-hover:rotate-45"
          />
        </div>

        {/* Text */}
        <h2 className="text-2xl font-bold text-white">{cat.title}</h2>

        <p className="mt-2 text-sm text-gray-400">
          Explore latest {cat.title.toLowerCase()} news
        </p>
      </div>
    </Link>
  );
}
