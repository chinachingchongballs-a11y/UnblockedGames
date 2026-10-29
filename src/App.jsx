/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Gamepad2,
  Search,
  Dices,
  Code,
  ShieldAlert,
  ArrowLeft,
  Flame,
  Star,
  Heart,
  SlidersHorizontal,
  X,
  Keyboard,
  Info
} from 'lucide-react';
import { DEFAULT_GAMES } from './data/games.js';
import { GameCard } from './components/GameCard.jsx';
import { IframePlayer } from './components/IframePlayer.jsx';
import { JsonEditorModal } from './components/JsonEditorModal.jsx';
import { CloakScreen } from './components/CloakScreen.jsx';

const STORAGE_KEY_GAMES = 'playzone_custom_games_v1';
const STORAGE_KEY_FAVS = 'playzone_favorites_v1';
const STORAGE_KEY_RECENT = 'playzone_recent_v1';

export default function App() {
  // Games state
  const [games, setGames] = useState(DEFAULT_GAMES);
  const [selectedGame, setSelectedGame] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [recentIds, setRecentIds] = useState([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isCloaked, setIsCloaked] = useState(false);
  const [isTheater, setIsTheater] = useState(false);

  const searchInputRef = useRef(null);

  // Load games from /games.json and localStorage
  useEffect(() => {
    // 1. Load favorites from localStorage
    try {
      const savedFavs = localStorage.getItem(STORAGE_KEY_FAVS);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const savedRecent = localStorage.getItem(STORAGE_KEY_RECENT);
      if (savedRecent) setRecentIds(JSON.parse(savedRecent));
    } catch (e) {
      console.warn('Storage read failed', e);
    }

    // 2. Fetch public /games.json relative to base URL (supports GitHub Pages subpaths)
    const base = import.meta.env.BASE_URL || './';
    const jsonUrl = base.endsWith('/') ? `${base}games.json` : `${base}/games.json`;
    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          if (data.length === 0) {
            localStorage.removeItem(STORAGE_KEY_GAMES);
            setGames([]);
          } else {
            const custom = localStorage.getItem(STORAGE_KEY_GAMES);
            if (custom) {
              try {
                setGames(JSON.parse(custom));
              } catch {
                setGames(data);
              }
            } else {
              setGames(data);
            }
          }
        }
      })
      .catch((err) => {
        console.info('Using default bundled games catalog:', err);
        setGames(DEFAULT_GAMES);
      });
  }, []);

  // Panic button hotkey listener (` or Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle cloak with '`' (tilde) key
      if (e.key === '`') {
        e.preventDefault();
        setIsCloaked((prev) => !prev);
      }
      // Focus search with '/' key
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync page title with Cloak state
  useEffect(() => {
    if (isCloaked) {
      document.title = 'Research Project - Distributed Systems Notes';
    } else if (selectedGame) {
      document.title = `${selectedGame.title} - PlayZone Unblocked`;
    } else {
      document.title = 'PlayZone - Unblocked Games Hub';
    }
  }, [isCloaked, selectedGame]);

  const handleToggleFavorite = (id, e) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(next));
      } catch (err) {
        console.warn('Favorite save failed', err);
      }
      return next;
    });
  };

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update play count in state
    setGames((prev) =>
      prev.map((g) => (g.id === game.id ? { ...g, plays: g.plays + 1 } : g))
    );

    // Track recently played
    setRecentIds((prev) => {
      const filtered = prev.filter((id) => id !== game.id);
      const updated = [game.id, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
      } catch (e) {
        console.warn('Recent save failed', e);
      }
      return updated;
    });
  };

  const handleRandomGame = () => {
    if (games.length === 0) return;
    const randomIndex = Math.floor(Math.random() * games.length);
    handleSelectGame(games[randomIndex]);
  };

  const handleSaveGames = (updatedGames) => {
    setGames(updatedGames);
    try {
      localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(updatedGames));
    } catch (e) {
      console.warn('Games save failed', e);
    }
  };

  const handleResetDefaults = () => {
    setGames(DEFAULT_GAMES);
    try {
      localStorage.removeItem(STORAGE_KEY_GAMES);
    } catch (e) {
      console.warn('Games reset failed', e);
    }
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    games.forEach((g) => {
      if (g.category) set.add(g.category);
    });
    return ['All', ...Array.from(set), 'Favorites'];
  }, [games]);

  // Filtered & Sorted Games list
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        // Category filter
        if (activeCategory === 'Favorites') {
          if (!favorites.includes(game.id)) return false;
        } else if (activeCategory !== 'All') {
          if (game.category.toLowerCase() !== activeCategory.toLowerCase()) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = game.title.toLowerCase().includes(q);
          const matchDesc = game.description.toLowerCase().includes(q);
          const matchTags = game.tags?.some((t) => t.toLowerCase().includes(q));
          const matchCat = game.category.toLowerCase().includes(q);
          return matchTitle || matchDesc || matchTags || matchCat;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return b.plays - a.plays; // default 'popular'
      });
  }, [games, activeCategory, searchQuery, sortBy, favorites]);

  // Recently played game items
  const recentGames = useMemo(() => {
    return recentIds
      .map((id) => games.find((g) => g.id === id))
      .filter((g) => Boolean(g));
  }, [recentIds, games]);

  // Featured game for the hero showcase
  const featuredGame = useMemo(() => {
    return games.find((g) => g.featured) || games[0];
  }, [games]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-sky-500/30 selection:text-sky-200">
      {/* Cloak Disguise Screen (Emergency Stealth Mode) */}
      {isCloaked && <CloakScreen onUncloak={() => setIsCloaked(false)} />}

      {/* Main Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => setSelectedGame(null)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 group-hover:bg-sky-500/20 transition-all">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">PLAYZONE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider -mt-0.5">
                UNBLOCKED GAMES
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search games or tags... (Press '/' to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {/* Random Game */}
            <button
              onClick={handleRandomGame}
              title="Surprise me with a random game"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <Dices className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Random</span>
            </button>

            {/* JSON Catalog Manager */}
            <button
              onClick={() => setIsJsonModalOpen(true)}
              title="Inspect and edit games.json catalog"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <Code className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">games.json</span>
            </button>

            {/* Panic / Cloak Stealth Button */}
            <button
              onClick={() => setIsCloaked(true)}
              title="Instant Google Docs Stealth Screen (Hotkey: ` or ESC)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 rounded-lg transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Panic <kbd className="hidden sm:inline font-mono text-[10px] text-rose-400/80">(`)</kbd></span>
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="px-4 pb-3 md:hidden">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search unblocked games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        {/* VIEW 1: ACTIVE GAME PLAYER VIEW */}
        {selectedGame ? (
          <div className="space-y-6 animate-fade-in">
            {/* Back button & Breadcrumbs */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedGame(null)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Games Catalog</span>
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{selectedGame.category}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-200">{selectedGame.title}</span>
              </div>
            </div>

            {/* Embedded Iframe Player Component */}
            <IframePlayer
              game={selectedGame}
              isFavorite={favorites.includes(selectedGame.id)}
              onToggleFavorite={() => handleToggleFavorite(selectedGame.id)}
              onClose={() => setSelectedGame(null)}
              isTheater={isTheater}
              onToggleTheater={() => setIsTheater((prev) => !prev)}
            />

            {/* Game Info, Description & Controls Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 border border-slate-800/80 rounded-xl p-5">
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-white tracking-tight">{selectedGame.title}</h1>
                  <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {Number(selectedGame.rating).toFixed(1)} / 5.0
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedGame.description}
                </p>

                {/* Unboxed tags */}
                <div className="flex items-center flex-wrap gap-2 pt-2 text-xs text-slate-400">
                  <span className="text-slate-500 font-medium">Tags:</span>
                  {selectedGame.tags?.map((tag, idx) => (
                    <span key={tag} className="text-slate-300">
                      #{tag}
                      {idx < selectedGame.tags.length - 1 && (
                        <span aria-hidden="true" className="text-slate-600 ml-2">·</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Controls reference box */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-2">
                    <Keyboard className="w-4 h-4 text-sky-400" />
                    <span>Controls Guide</span>
                  </div>
                  <p className="text-xs font-mono text-sky-300 bg-slate-900/90 p-2.5 rounded border border-slate-800 leading-relaxed">
                    {selectedGame.controls}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Iframe Source:</span>
                  <span className="font-mono text-slate-300 truncate max-w-[160px]">
                    {selectedGame.iframeSrc || 'Embedded HTML'}
                  </span>
                </div>
              </div>
            </div>

            {/* Suggested Games Row */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  You Might Also Like
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {games
                  .filter((g) => g.id !== selectedGame.id && g.category === selectedGame.category)
                  .slice(0, 4)
                  .map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isFavorite={favorites.includes(game.id)}
                      onSelect={handleSelectGame}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: GAMES CATALOG BROWSER VIEW */
          <div className="space-y-8 animate-fade-in">
            {/* Hero Showcase (shown when no specific search is active) */}
            {!searchQuery && activeCategory === 'All' && featuredGame && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="space-y-4 max-w-xl">
                  {/* Clean unboxed kicker */}
                  <div className="flex items-center gap-2 text-xs text-sky-400 font-semibold tracking-wide uppercase">
                    <Flame className="w-4 h-4" />
                    <span>Featured Unblocked Title</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-400">{featuredGame.category}</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {featuredGame.title}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
                    {featuredGame.description}
                  </p>

                  <div className="flex items-center gap-4 pt-1">
                    <button
                      onClick={() => handleSelectGame(featuredGame)}
                      className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-lg shadow-sky-500/20 hover:scale-[1.02]"
                    >
                      PLAY NOW
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(featuredGame.id)}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-2 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          favorites.includes(featuredGame.id)
                            ? 'text-rose-500 fill-current'
                            : ''
                        }`}
                      />
                      <span>Favorite</span>
                    </button>
                  </div>
                </div>

                {/* Hero preview thumbnail */}
                <div
                  onClick={() => handleSelectGame(featuredGame)}
                  className="w-full md:w-80 aspect-[16/10] rounded-xl overflow-hidden border border-slate-700/80 cursor-pointer shadow-2xl group relative"
                >
                  <img
                    src={featuredGame.thumbnail}
                    alt={featuredGame.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors" />
                </div>
              </div>
            )}

            {/* Recently Played Bar (if available) */}
            {recentGames.length > 0 && !searchQuery && activeCategory === 'All' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Jump Back In
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {recentGames.slice(0, 6).map((game) => (
                    <div
                      key={game.id}
                      onClick={() => handleSelectGame(game)}
                      className="bg-slate-900 border border-slate-800/80 hover:border-sky-500/50 rounded-lg p-2.5 cursor-pointer group transition-all"
                    >
                      <div className="aspect-[16/10] rounded overflow-hidden bg-slate-950 mb-2">
                        <img
                          src={game.thumbnail}
                          alt={game.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="font-semibold text-xs text-slate-200 group-hover:text-sky-400 truncate">
                        {game.title}
                      </h4>
                      <div className="text-[10px] text-slate-500">{game.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter and Category Controls */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                {/* Category Segmented Tabs (Functional Buttons) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                  {categories.map((cat) => {
                    const isSelected = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                          isSelected
                            ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                        }`}
                      >
                        {cat === 'Favorites' ? `⭐ Favorites (${favorites.length})` : cat}
                      </button>
                    );
                  })}
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 self-end md:self-auto text-xs text-slate-400">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="rating">Top Rated</option>
                    <option value="title">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div>
                  Showing <span className="text-white font-semibold">{filteredGames.length}</span>{' '}
                  {activeCategory === 'All' ? 'unblocked games' : `${activeCategory} games`}
                  {searchQuery && (
                    <span>
                      {' '}
                      matching &ldquo;<span className="text-sky-400">{searchQuery}</span>&rdquo;
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <Info className="w-3.5 h-3.5" />
                  <span>100% Client-Side JSON · Zero Lag</span>
                </div>
              </div>
            </div>

            {/* Game Cards Grid */}
            {filteredGames.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {filteredGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    isFavorite={favorites.includes(game.id)}
                    onSelect={handleSelectGame}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : games.length === 0 ? (
              /* Catalog empty state */
              <div className="text-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 max-w-xl mx-auto">
                <Gamepad2 className="w-14 h-14 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Games in Catalog</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  All games have been removed. You can now store and customize your own games as iframes in the <code className="text-sky-400 font-mono">games.json</code> file or add them directly using the button below.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={() => setIsJsonModalOpen(true)}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Code className="w-4 h-4 text-sky-200" />
                    <span>Open games.json / Add Game</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Search empty state */
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8">
                <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No games found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                  No games matched your current search criteria. You can clear your search or add
                  custom iframe games to your <code className="text-sky-400 font-mono">games.json</code> file.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('All');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => setIsJsonModalOpen(true)}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white rounded-lg transition-colors"
                  >
                    Add Game to JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">PLAYZONE</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Unblocked Games Catalog</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">Stores each game as an Iframe in JSON</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsJsonModalOpen(true)}
              className="text-slate-400 hover:text-sky-400 transition-colors"
            >
              Inspect games.json
            </button>
            <button
              onClick={handleRandomGame}
              className="text-slate-400 hover:text-sky-400 transition-colors"
            >
              Surprise Game
            </button>
            <button
              onClick={() => setIsCloaked(true)}
              className="text-slate-400 hover:text-rose-400 transition-colors"
            >
              Panic Mode
            </button>
          </div>
        </div>
      </footer>

      {/* JSON Editor / Catalog Modal */}
      <JsonEditorModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        games={games}
        onSaveGames={handleSaveGames}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
}
