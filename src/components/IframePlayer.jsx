import React, { useRef, useState } from 'react';
import { Maximize2, Minimize2, RotateCcw, ExternalLink, Shield, Heart } from 'lucide-react';

export const IframePlayer = ({
  game,
  isFavorite,
  onToggleFavorite,
  isTheater = false,
  onToggleTheater,
}) => {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extract source URL from game.iframe string if iframeSrc is not provided
  const getIframeSrc = () => {
    let raw = game.iframeSrc;
    if (!raw) {
      const match = game.iframe?.match(/src=["']([^"']+)["']/i);
      raw = (match && match[1]) ? match[1] : (game.iframe || '');
    }
    // If path is a local game path like /games/... adjust with base URL for GitHub Pages
    if (typeof raw === 'string' && raw.startsWith('/games/')) {
      const base = import.meta.env.BASE_URL || './';
      const cleanBase = base.endsWith('/') ? base : `${base}/`;
      return `${cleanBase}${raw.replace(/^\//, '')}`;
    }
    return raw;
  };

  const srcUrl = getIframeSrc();

  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleOpenBlank = () => {
    // Classic stealth unblocked technique: open about:blank with embedded iframe
    const win = window.open('about:blank', '_blank');
    if (win) {
      const doc = win.document;
      doc.title = 'Google Drive';
      doc.body.style.margin = '0';
      doc.body.style.height = '100vh';
      doc.body.style.overflow = 'hidden';
      doc.body.style.background = '#000';
      const ifr = doc.createElement('iframe');
      ifr.style.border = 'none';
      ifr.style.width = '100%';
      ifr.style.height = '100%';
      ifr.style.margin = '0';
      ifr.src = new URL(srcUrl, window.location.href).href;
      doc.body.appendChild(ifr);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isTheater ? 'w-full h-[85vh]' : 'w-full aspect-[16/10] min-h-[460px] max-h-[720px]'
      }`}
    >
      {/* Top Player Action Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-slate-300 text-xs select-none">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-100 text-sm truncate max-w-[220px] sm:max-w-md">
            {game.title}
          </span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-slate-400 hidden sm:inline">{game.category}</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Favorite toggle */}
          <button
            onClick={() => onToggleFavorite(game.id)}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-2 rounded-lg transition-colors ${
              isFavorite
                ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Reload button */}
          <button
            onClick={handleReload}
            title="Reload game"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Theater Mode toggle */}
          {onToggleTheater && (
            <button
              onClick={onToggleTheater}
              title={isTheater ? 'Default view' : 'Theater mode'}
              className={`p-2 rounded-lg transition-colors hidden sm:block ${
                isTheater
                  ? 'text-sky-400 bg-sky-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen button */}
          <button
            onClick={handleFullscreen}
            title="Fullscreen"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Cloaked Tab (about:blank) */}
          <button
            onClick={handleOpenBlank}
            title="Open in stealth tab (about:blank)"
            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors flex items-center gap-1"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden md:inline text-[11px] font-medium">Popout</span>
          </button>
        </div>
      </div>

      {/* Embedded Iframe Container */}
      <div className="relative flex-1 w-full h-full bg-black">
        <iframe
          ref={iframeRef}
          src={srcUrl}
          title={game.title}
          className="w-full h-full border-0 block"
          allow="autoplay; fullscreen; keyboard; gamepad"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          loading="eager"
        />
      </div>

      {/* Bottom Controls strip */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono text-[11px]">Controls: {game.controls}</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px]">
          <span>Rating: {game.rating} ★</span>
          <span>·</span>
          <span>{Number(game.plays).toLocaleString()} plays</span>
        </div>
      </div>
    </div>
  );
};
