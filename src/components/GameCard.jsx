import React from 'react';
import { Play, Heart, Star } from 'lucide-react';

export const GameCard = ({
  game,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  return (
    <div
      onClick={() => onSelect(game)}
      className="group relative bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden hover:border-slate-700 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-200 cursor-pointer flex flex-col"
    >
      {/* Thumbnail Aspect Ratio Box */}
      <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
        <img
          src={game.thumbnail}
          alt={game.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />

        {/* Subtle dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Favorite heart button */}
        <button
          onClick={(e) => onToggleFavorite(game.id, e)}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-2.5 right-2.5 p-2 rounded-lg backdrop-blur-md transition-all ${
            isFavorite
              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
              : 'bg-slate-950/60 text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-950/40 backdrop-blur-[2px]">
          <div className="w-11 h-11 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center shadow-lg shadow-sky-500/30 transform group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Content Section with clean unboxed typography */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-semibold text-slate-100 text-sm group-hover:text-sky-400 transition-colors line-clamp-1">
            {game.title}
          </h3>

          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Unboxed metadata separator discipline */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-800/60">
          <span className="text-slate-400 font-medium">{game.category}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="flex items-center gap-0.5 text-amber-400 font-medium">
            <Star className="w-3 h-3 fill-current" />
            {Number(game.rating).toFixed(1)}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{(Number(game.plays) / 1000).toFixed(0)}k plays</span>
        </div>
      </div>
    </div>
  );
};
