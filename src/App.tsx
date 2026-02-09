
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import InitiativeList from './components/InitiativeList';
import InitiativeDetail from './components/InitiativeDetail';
import InitiativeBoard from './components/InitiativeBoard';
import SettingsModal from './components/SettingsModal';
import HelpPage from './components/HelpPage';
import { Initiative, ViewMode, ServerDirectory, SearchResult, toInitiative } from './types';
import { fetchConfig, fetchDirectories, fetchInitiatives, searchInitiatives, createInitiative, updateFile, fetchInitiativeDetail } from './api';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('Board');
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [directories, setDirectories] = useState<ServerDirectory[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initiativeTypes, setInitiativeTypes] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultsInfo, setSearchResultsInfo] = useState<string | null>(null);
  const [searchMatchedIds, setSearchMatchedIds] = useState<Set<string> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchInfoTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load directories and config on mount
  useEffect(() => {
    fetchDirectories()
      .then(dirs => {
        setDirectories(dirs);
        const defaultDir = dirs.find(d => d.default);
        setCurrentDirectory(defaultDir?.name || dirs[0]?.name || null);
      })
      .catch(err => setError(err.message));
    fetchConfig()
      .then(config => setInitiativeTypes(config.initiativeTypes || []))
      .catch(() => {});
  }, []);

  // Load initiatives when directory changes
  useEffect(() => {
    if (currentDirectory === null) return;
    setLoading(true);
    setError(null);
    fetchInitiatives(currentDirectory)
      .then(serverInits => {
        setInitiatives(serverInits.map(toInitiative));
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [currentDirectory]);

  const reloadInitiatives = async () => {
    if (!currentDirectory) return;
    const serverInits = await fetchInitiatives(currentDirectory);
    setInitiatives(serverInits.map(toInitiative));
  };

  // Server-side search with debounce (matches original index.html behavior)
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (selectedInitiativeId) {
      setSelectedInitiativeId(null);
    }

    // Clear previous debounce
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchInfoTimeoutRef.current) clearTimeout(searchInfoTimeoutRef.current);

    if (!query.trim()) {
      setIsSearching(false);
      setSearchResultsInfo(null);
      setSearchMatchedIds(null);
      return;
    }

    setIsSearching(true);
    setSearchResultsInfo(null);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchInitiatives(query, currentDirectory || undefined);
        setIsSearching(false);

        const uniqueIds = new Set(results.map(r => r.initiative));
        setSearchMatchedIds(uniqueIds);

        // Show results info
        const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
        if (totalMatches > 0) {
          setSearchResultsInfo(`Found ${totalMatches} match${totalMatches !== 1 ? 'es' : ''} in ${uniqueIds.size} initiative${uniqueIds.size !== 1 ? 's' : ''}`);
        } else {
          setSearchResultsInfo('No results found');
        }

        // Auto-hide results info after 3s
        searchInfoTimeoutRef.current = setTimeout(() => {
          setSearchResultsInfo(null);
        }, 3000);
      } catch (err) {
        setIsSearching(false);
        setSearchResultsInfo('Search failed. Please try again.');
        searchInfoTimeoutRef.current = setTimeout(() => {
          setSearchResultsInfo(null);
        }, 3000);
      }
    }, 300);
  }, [currentDirectory, selectedInitiativeId]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (searchInfoTimeoutRef.current) clearTimeout(searchInfoTimeoutRef.current);
    };
  }, []);

  const filteredInitiatives = searchMatchedIds
    ? initiatives.filter(init => searchMatchedIds.has(init.id))
    : initiatives;

  const handleAddInitiative = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = (formData.get('id') as string).trim();
    const name = (formData.get('name') as string).trim();
    const type = (formData.get('type') as string).trim();

    try {
      await createInitiative({ id, name, type, directory: currentDirectory || undefined });
      setIsAddingNew(false);
      await reloadInitiatives();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSettingsSaved = async () => {
    // Reload directories in case they changed
    try {
      const dirs = await fetchDirectories();
      setDirectories(dirs);
      const defaultDir = dirs.find(d => d.default);
      const newDir = defaultDir?.name || dirs[0]?.name || null;
      if (!dirs.some(d => d.name === currentDirectory)) {
        setCurrentDirectory(newDir);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateInitiativeStatus = async (updated: Initiative) => {
    // Optimistically update local state
    setInitiatives(prev => prev.map(i => i.id === updated.id ? updated : i));

    // Persist by updating the README status line
    try {
      const detail = await fetchInitiativeDetail(updated.id, currentDirectory || undefined);
      const updatedReadme = detail.readme.replace(
        /\*\*Status:\*\* .+$/m,
        `**Status:** ${updated.status}`
      );
      await updateFile(updated.id, 'readme', updatedReadme, currentDirectory || undefined);
    } catch (err: any) {
      setError(`Failed to persist status: ${err.message}`);
      await reloadInitiatives();
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-200">
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        toggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={handleSearch}
        isSearching={isSearching}
        searchResultsInfo={searchResultsInfo}
        onNewInitiative={() => setIsAddingNew(true)}
        directories={directories}
        currentDirectory={currentDirectory}
        onDirectoryChange={setCurrentDirectory}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          initiatives={initiatives}
          onSelectInitiative={(init) => { setShowHelp(false); setSelectedInitiativeId(init.id); }}
          selectedInitiativeId={selectedInitiativeId || undefined}
          onOpenSettings={() => setShowSettings(true)}
          onOpenHelp={() => { setSelectedInitiativeId(null); setShowHelp(true); }}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <span className="material-icons text-sm">close</span>
              </button>
            </div>
          )}

          {showHelp ? (
            <HelpPage onBack={() => setShowHelp(false)} />
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400 flex items-center gap-2">
                <span className="material-icons animate-spin">refresh</span>
                Loading initiatives...
              </div>
            </div>
          ) : selectedInitiativeId ? (
            <InitiativeDetail
              initiativeId={selectedInitiativeId}
              directory={currentDirectory}
              onBack={() => setSelectedInitiativeId(null)}
            />
          ) : (
            viewMode === 'List' ? (
              <InitiativeList
                initiatives={filteredInitiatives}
                onSelect={(init) => setSelectedInitiativeId(init.id)}
              />
            ) : (
              <InitiativeBoard
                initiatives={filteredInitiatives}
                onSelect={(init) => setSelectedInitiativeId(init.id)}
                onUpdateInitiative={handleUpdateInitiativeStatus}
              />
            )
          )}
        </main>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={handleSettingsSaved}
        />
      )}

      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="material-icons text-primary">add_circle</span>
              New Initiative
            </h2>
            <form onSubmit={handleAddInitiative} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Initiative ID</label>
                <input required name="id" className="w-full rounded border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono" placeholder="e.g., FRAUD-2026-01" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input required name="name" className="w-full rounded border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-primary focus:border-primary outline-none" placeholder="e.g., Fraud Real-time Signals Integration" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select name="type" required className="w-full rounded border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-primary focus:border-primary outline-none">
                  <option value="">Select type...</option>
                  {initiativeTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAddingNew(false)} className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded shadow-lg hover:bg-primary-dark transition-all">Create Initiative</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
