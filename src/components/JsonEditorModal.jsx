import React, { useState } from 'react';
import { X, Copy, Download, RotateCcw, Plus, Check, Code, FileText } from 'lucide-react';

export const JsonEditorModal = ({
  isOpen,
  onClose,
  games,
  onSaveGames,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState('view');
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(games, null, 2));
  const [error, setError] = useState(null);

  // New game form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Arcade');
  const [iframeCode, setIframeCode] = useState('');
  const [description, setDescription] = useState('');
  const [controls, setControls] = useState('Mouse or Arrow keys');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'games.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON root must be an array of game objects');
      }
      onSaveGames(parsed);
      setError(null);
      onClose();
    } catch (e) {
      setError(e.message || 'Invalid JSON syntax');
    }
  };

  const handleAddGame = (e) => {
    e.preventDefault();
    if (!title.trim() || !iframeCode.trim()) {
      setError('Title and Iframe code/URL are required');
      return;
    }

    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `game-${Date.now()}`;

    // Normalize iframe string
    let finalIframe = iframeCode.trim();
    let srcUrl = '';
    if (finalIframe.startsWith('http://') || finalIframe.startsWith('https://') || finalIframe.startsWith('/')) {
      srcUrl = finalIframe;
      finalIframe = `<iframe src="${finalIframe}" title="${title}" frameborder="0" allowfullscreen style="width:100%;height:100%;border:none;"></iframe>`;
    } else {
      const match = finalIframe.match(/src=["']([^"']+)["']/i);
      if (match) srcUrl = match[1];
    }

    const newGame = {
      id,
      title: title.trim(),
      category: category.trim() || 'Arcade',
      description: description.trim() || 'Custom unblocked game',
      thumbnail: thumbnail.trim(),
      iframe: finalIframe,
      iframeSrc: srcUrl || undefined,
      controls: controls.trim() || 'Standard keyboard/mouse',
      rating: 5.0,
      plays: 1,
      tags: [category, 'Custom', 'Unblocked'],
      featured: false,
    };

    const updated = [newGame, ...games];
    onSaveGames(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setTitle('');
    setIframeCode('');
    setDescription('');
    setActiveTab('view');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <Code className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="font-bold text-slate-100 text-base">games.json Catalog Manager</h2>
              <p className="text-xs text-slate-400">
                View, edit, or add games stored as iframes in JSON
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('view')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'view'
                  ? 'border-sky-400 text-sky-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              JSON File Source ({games.length} games)
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'add'
                  ? 'border-sky-400 text-sky-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Game to JSON
            </button>
          </div>

          {activeTab === 'view' && (
            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download .json
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          {activeTab === 'view' ? (
            <div className="flex flex-col h-full">
              <label className="text-xs text-slate-400 mb-2 block font-medium">
                Live JSON Content (Each game contains an <code className="text-sky-300 font-mono">iframe</code> property):
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full h-80 font-mono text-xs bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-3 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                spellCheck={false}
              />
              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={() => {
                    onResetDefaults();
                    onClose();
                  }}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 py-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Default games.json
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyJson}
                    className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddGame} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Game Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Neon Horizon"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Action">Action</option>
                    <option value="Arcade">Arcade</option>
                    <option value="Puzzle">Puzzle</option>
                    <option value="Retro">Retro</option>
                    <option value="Sports">Sports</option>
                    <option value="Strategy">Strategy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Iframe HTML Code or Embed URL
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={`<iframe src="https://example.com/game" frameborder="0" allowfullscreen></iframe>`}
                  value={iframeCode}
                  onChange={(e) => setIframeCode(e.target.value)}
                  className="w-full font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Paste the full &lt;iframe&gt; code or a direct web embed URL.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Short description of the gameplay"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Controls Guide</label>
                  <input
                    type="text"
                    placeholder="e.g. Arrow Keys to drive, Space to drift"
                    value={controls}
                    onChange={(e) => setControls(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Thumbnail Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('view')}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Append to games.json
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
