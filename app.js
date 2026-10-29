/**
 * PlayZone - Unblocked Games Hub
 * Standalone Vanilla JavaScript Applet
 * Compatible with GitHub Pages, static hosting, and local preview.
 */

// Default Fallback Game Data (matches games.json)
const DEFAULT_CATALOG = [
  {
    id: "stunt-bike-extreme",
    title: "Stunt Bike Extreme",
    category: "Sports",
    description: "Perform insane motorcycle flips, balance across treacherous obstacles, and race to the finish line in Stunt Bike Extreme.",
    thumbnail: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
    iframe: '<iframe src="https://www.madkidgames.com/full/stunt-bike-extreme" width="100%" height="540" frameborder="0" allowfullscreen scrolling="no" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
    iframeSrc: "https://www.madkidgames.com/full/stunt-bike-extreme",
    controls: "Arrow keys or WASD to accelerate, brake, and tilt bike. Space to restart.",
    rating: 4.9,
    plays: 14500,
    featured: true,
    tags: ["Motorcycle", "Stunt", "Action", "Physics", "Sports"]
  }
];

const STORAGE_KEY_GAMES = 'playzone_custom_games_v1';
const STORAGE_KEY_FAVS = 'playzone_favorites_v1';

// App State
let games = [];
let selectedGame = null;
let favorites = [];
let currentCategory = 'All';
let searchQuery = '';
let currentSort = 'popular';
let isCloaked = false;
let isTheater = false;

// DOM Elements
const gamesGrid = document.getElementById('games-grid');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptySub = document.getElementById('empty-sub');
const categoriesList = document.getElementById('categories-list');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const sortSelect = document.getElementById('sort-select');
const statusText = document.getElementById('status-text');
const playerView = document.getElementById('player-view');
const catalogView = document.getElementById('catalog-view');
const modalBackdrop = document.getElementById('modal-backdrop');
const cloakScreen = document.getElementById('cloak-screen');

// Player DOM Elements
const playerTitle = document.getElementById('player-title');
const playerIframeBox = document.getElementById('player-iframe-box');
const playerControls = document.getElementById('player-controls');
const playerDesc = document.getElementById('player-desc');
const playerRating = document.getElementById('player-rating');
const playerFavBtn = document.getElementById('player-fav-btn');

// JSON Modal Elements
const jsonTextarea = document.getElementById('json-textarea');
const tabView = document.getElementById('tab-view');
const tabAdd = document.getElementById('tab-add');
const viewPane = document.getElementById('view-pane');
const addPane = document.getElementById('add-pane');
const addGameForm = document.getElementById('add-game-form');

// Initialize Application
async function initApp() {
  // 1. Load favorites from localStorage
  try {
    const savedFavs = localStorage.getItem(STORAGE_KEY_FAVS);
    if (savedFavs) favorites = JSON.parse(savedFavs);
  } catch (e) {
    console.warn('Storage read error:', e);
  }

  // 2. Load games from games.json with fallback
  try {
    // Relative fetch ensures compatibility on GitHub Pages subpaths
    const res = await fetch('./games.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        games = data;
      }
    }
  } catch (err) {
    console.info('Using fallback default catalog:', err);
    games = [...DEFAULT_CATALOG];
  }

  // If fetch was empty, check if we have cached local games
  if (games.length === 0) {
    try {
      const local = localStorage.getItem(STORAGE_KEY_GAMES);
      if (local) games = JSON.parse(local);
    } catch (e) {}
  }

  setupEventListeners();
  renderCategories();
  renderGames();
}

// Render Category Tabs
function renderCategories() {
  const catSet = new Set();
  games.forEach(g => { if (g.category) catSet.add(g.category); });
  const allCats = ['All', ...Array.from(catSet), 'Favorites'];

  categoriesList.innerHTML = '';
  allCats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `cat-btn ${cat === currentCategory ? 'active' : ''}`;
    btn.textContent = cat === 'Favorites' ? `⭐ Favorites (${favorites.length})` : cat;
    btn.addEventListener('click', () => {
      currentCategory = cat;
      renderCategories();
      renderGames();
    });
    categoriesList.appendChild(btn);
  });
}

// Render Games Grid
function renderGames() {
  let list = games.filter(g => {
    // Category Filter
    if (currentCategory === 'Favorites') {
      if (!favorites.includes(g.id)) return false;
    } else if (currentCategory !== 'All') {
      if (g.category?.toLowerCase() !== currentCategory.toLowerCase()) return false;
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = g.title?.toLowerCase().includes(q);
      const matchDesc = g.description?.toLowerCase().includes(q);
      const matchCat = g.category?.toLowerCase().includes(q);
      const matchTags = g.tags?.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCat || matchTags;
    }
    return true;
  });

  // Sorting
  if (currentSort === 'rating') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (currentSort === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // popular
    list.sort((a, b) => (b.plays || 0) - (a.plays || 0));
  }

  // Update Status Text
  statusText.textContent = `Showing ${list.length} ${currentCategory === 'All' ? 'unblocked games' : currentCategory + ' games'}`;

  // Clear Grid
  gamesGrid.innerHTML = '';

  if (list.length === 0) {
    gamesGrid.style.display = 'none';
    emptyState.style.display = 'block';

    if (games.length === 0) {
      emptyTitle.textContent = 'No Games in Catalog';
      emptySub.textContent = 'Your games.json file is ready. Add games by pasting their iframe code or URL, or paste your JSON directly!';
    } else {
      emptyTitle.textContent = 'No Games Found';
      emptySub.textContent = `No games matched "${searchQuery}". Try clearing your search query or selecting another category.`;
    }
    return;
  }

  gamesGrid.style.display = 'grid';
  emptyState.style.display = 'none';

  list.forEach(game => {
    const isFav = favorites.includes(game.id);
    const card = document.createElement('div');
    card.className = 'game-card';

    card.innerHTML = `
      <div class="card-thumb-wrap">
        <img class="card-thumb" src="${game.thumbnail || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80'}" alt="${game.title}" loading="lazy">
        <button class="card-fav-btn ${isFav ? 'active' : ''}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
          ${isFav ? '♥' : '♡'}
        </button>
        <div class="card-hover-play">
          <div class="play-bubble">▶</div>
        </div>
      </div>
      <div class="card-body">
        <div>
          <h3 class="card-title">${game.title}</h3>
          <p class="card-desc">${game.description || ''}</p>
        </div>
        <div class="card-meta">
          <span class="card-cat">${game.category || 'Arcade'}</span>
          <span>·</span>
          <span class="card-star">★ ${(game.rating || 4.8).toFixed(1)}</span>
          <span>·</span>
          <span>${Math.round((game.plays || 1000) / 1000)}k plays</span>
        </div>
      </div>
    `;

    // Click Card to Play Game
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-fav-btn')) return;
      openGame(game);
    });

    // Favorite Button Handler
    const favBtn = card.querySelector('.card-fav-btn');
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(game.id);
    });

    gamesGrid.appendChild(card);
  });
}

// Open Selected Game in Player
function openGame(game) {
  selectedGame = game;
  catalogView.style.display = 'none';
  playerView.style.display = 'flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  playerTitle.textContent = game.title;
  playerDesc.textContent = game.description || '';
  playerControls.textContent = game.controls || 'Mouse or Keyboard';
  playerRating.textContent = `★ ${(game.rating || 5.0).toFixed(1)}`;

  updatePlayerFavBtn();

  // Extract source URL or embed raw iframe
  let src = game.iframeSrc;
  if (!src && game.iframe) {
    const match = game.iframe.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) src = match[1];
  }
  if (!src) src = game.iframe;

  // Insert iframe
  playerIframeBox.innerHTML = `
    <iframe
      id="active-game-iframe"
      class="player-iframe"
      src="${src}"
      title="${game.title}"
      frameborder="0"
      allowfullscreen
      scrolling="no"
      loading="eager"
      referrerpolicy="no-referrer-when-downgrade"
      allow="autoplay; fullscreen; keyboard; gamepad">
    </iframe>
  `;

  // Increment play count
  game.plays = (game.plays || 0) + 1;
}

// Close Player & Back to Catalog
function closeGame() {
  selectedGame = null;
  playerIframeBox.innerHTML = '';
  playerView.style.display = 'none';
  catalogView.style.display = 'block';
  renderGames();
}

// Toggle Favorites
function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  try {
    localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favorites));
  } catch (e) {}

  renderCategories();
  renderGames();
  if (selectedGame && selectedGame.id === id) {
    updatePlayerFavBtn();
  }
}

function updatePlayerFavBtn() {
  if (!selectedGame) return;
  const isFav = favorites.includes(selectedGame.id);
  playerFavBtn.innerHTML = isFav ? '♥' : '♡';
  playerFavBtn.className = `player-tool-btn ${isFav ? 'active' : ''}`;
}

// Panic / Stealth Cloak Mode
function toggleCloak() {
  isCloaked = !isCloaked;
  if (isCloaked) {
    cloakScreen.style.display = 'flex';
    document.title = 'Research Project - Distributed Systems Notes';
  } else {
    cloakScreen.style.display = 'none';
    document.title = selectedGame ? `${selectedGame.title} - PlayZone Unblocked` : 'PlayZone - Unblocked Games Hub';
  }
}

// Open In Stealth Popout (about:blank)
function openStealthTab() {
  if (!selectedGame) return;
  let src = selectedGame.iframeSrc;
  if (!src && selectedGame.iframe) {
    const match = selectedGame.iframe.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) src = match[1];
  }
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
    ifr.referrerPolicy = 'no-referrer-when-downgrade';
    ifr.allow = 'autoplay; fullscreen; keyboard; gamepad';
    ifr.src = src;
    doc.body.appendChild(ifr);
  }
}

// JSON Modal Handlers
function openJsonModal() {
  modalBackdrop.style.display = 'flex';
  jsonTextarea.value = JSON.stringify(games, null, 2);
  switchJsonTab('view');
}

function closeJsonModal() {
  modalBackdrop.style.display = 'none';
}

function switchJsonTab(tab) {
  if (tab === 'view') {
    tabView.classList.add('active');
    tabAdd.classList.remove('active');
    viewPane.style.display = 'block';
    addPane.style.display = 'none';
  } else {
    tabAdd.classList.add('active');
    tabView.classList.remove('active');
    viewPane.style.display = 'none';
    addPane.style.display = 'block';
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Brand Click
  document.getElementById('brand-link').addEventListener('click', closeGame);

  // Search input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    searchClear.style.display = searchQuery ? 'block' : 'none';
    renderGames();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.style.display = 'none';
    renderGames();
  });

  // Sort selector
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderGames();
  });

  // Panic button & Keybindings
  document.getElementById('panic-btn').addEventListener('click', toggleCloak);
  document.getElementById('uncloak-btn').addEventListener('click', toggleCloak);

  window.addEventListener('keydown', (e) => {
    if (e.key === '`' || (e.key === 'Escape' && isCloaked)) {
      toggleCloak();
    }
    if (e.key === '/' && document.activeElement !== searchInput && !modalBackdrop.style.display.includes('flex')) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Random Game
  document.getElementById('random-btn').addEventListener('click', () => {
    if (games.length === 0) return;
    const random = games[Math.floor(Math.random() * games.length)];
    openGame(random);
  });

  // JSON Catalog Modal
  document.getElementById('json-btn').addEventListener('click', openJsonModal);
  document.getElementById('footer-json-btn')?.addEventListener('click', openJsonModal);
  document.getElementById('empty-add-btn')?.addEventListener('click', () => {
    openJsonModal();
    switchJsonTab('add');
  });
  document.getElementById('modal-close-btn').addEventListener('click', closeJsonModal);
  tabView.addEventListener('click', () => switchJsonTab('view'));
  tabAdd.addEventListener('click', () => switchJsonTab('add'));

  // Copy JSON
  document.getElementById('copy-json-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(jsonTextarea.value);
    alert('games.json copied to clipboard!');
  });

  // Download JSON
  document.getElementById('download-json-btn').addEventListener('click', () => {
    const blob = new Blob([jsonTextarea.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'games.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Apply JSON Changes
  document.getElementById('apply-json-btn').addEventListener('click', () => {
    try {
      const parsed = JSON.parse(jsonTextarea.value);
      if (Array.isArray(parsed)) {
        games = parsed;
        localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(games));
        renderCategories();
        renderGames();
        closeJsonModal();
      } else {
        alert('JSON root must be an array of game objects');
      }
    } catch (e) {
      alert('Invalid JSON: ' + e.message);
    }
  });

  // Add Game Form
  addGameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('new-title').value.trim();
    const category = document.getElementById('new-category').value.trim() || 'Arcade';
    const iframeVal = document.getElementById('new-iframe').value.trim();
    const desc = document.getElementById('new-desc').value.trim();
    const controls = document.getElementById('new-controls').value.trim() || 'Standard Controls';
    const thumbnail = document.getElementById('new-thumbnail').value.trim() || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80';

    if (!title || !iframeVal) {
      alert('Please provide title and iframe code/URL');
      return;
    }

    let src = '';
    let iframeCode = iframeVal;
    if (iframeVal.startsWith('http://') || iframeVal.startsWith('https://')) {
      src = iframeVal;
      iframeCode = `<iframe src="${iframeVal}" width="100%" height="540" frameborder="0" allowfullscreen></iframe>`;
    } else {
      const match = iframeVal.match(/src=["']([^"']+)["']/i);
      if (match) src = match[1];
    }

    const newGame = {
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `game-${Date.now()}`,
      title,
      category,
      description: desc,
      thumbnail,
      iframe: iframeCode,
      iframeSrc: src,
      controls,
      rating: 5.0,
      plays: 1,
      tags: [category, 'Custom'],
      featured: false
    };

    games.unshift(newGame);
    localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(games));
    renderCategories();
    renderGames();
    closeJsonModal();
    addGameForm.reset();
  });

  // Player Actions
  document.getElementById('player-back-btn').addEventListener('click', closeGame);

  playerFavBtn.addEventListener('click', () => {
    if (selectedGame) toggleFavorite(selectedGame.id);
  });

  document.getElementById('player-reload-btn').addEventListener('click', () => {
    const ifr = document.getElementById('active-game-iframe');
    if (ifr) ifr.src = ifr.src;
  });

  document.getElementById('player-theater-btn').addEventListener('click', () => {
    isTheater = !isTheater;
    playerIframeBox.classList.toggle('theater', isTheater);
  });

  document.getElementById('player-fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      playerIframeBox.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  });

  document.getElementById('player-popout-btn').addEventListener('click', openStealthTab);
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
