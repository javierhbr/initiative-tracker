
import React, { useRef, useEffect } from 'react';
import { ViewMode, ServerDirectory } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching?: boolean;
  searchResultsInfo?: string | null;
  onNewInitiative: () => void;
  directories: ServerDirectory[];
  currentDirectory: string | null;
  onDirectoryChange: (dirName: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  toggleDarkMode,
  isDarkMode,
  searchQuery,
  setSearchQuery,
  isSearching,
  searchResultsInfo,
  onNewInitiative,
  directories,
  currentDirectory,
  onDirectoryChange,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col sticky top-0 z-20 shadow-sm">
      {/* Top Utility Bar (Desktop App Feel) */}
      <div className="h-8 bg-white dark:bg-slate-900 border-b border-border-light dark:border-border-dark flex items-center justify-end px-4 gap-4 transition-colors duration-200">
        <div className="flex items-center gap-3 border border-border-light dark:border-border-dark rounded px-2 py-0.5 bg-slate-50 dark:bg-slate-800">
          <span className="material-icons text-slate-400 text-sm cursor-pointer hover:text-primary transition-colors">screenshot_monitor</span>
          <span className="material-icons text-slate-400 text-sm cursor-pointer hover:text-primary transition-colors">sync</span>
          <span className="material-icons text-slate-400 text-sm cursor-pointer hover:text-primary transition-colors">fullscreen</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="h-14 border-b border-border-light dark:border-border-dark bg-white dark:bg-surface-dark flex items-center px-6 gap-10 transition-colors duration-200">
        {/* Left: App Logo & View Toggles */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <span className="material-icons text-primary text-2xl">inventory_2</span>
            <span className="tracking-tight">Initiative Tracker</span>
          </div>

          <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-border-light dark:border-border-dark">
            <button
              onClick={() => setViewMode('List')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                viewMode === 'List'
                  ? 'text-primary bg-white dark:bg-slate-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('Board')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                viewMode === 'Board'
                  ? 'text-primary bg-white dark:bg-slate-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Board
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 flex-1">
          {/* Workspace Dropdown */}
          <div className="relative">
            <select
              value={currentDirectory || ''}
              onChange={(e) => onDirectoryChange(e.target.value)}
              className="appearance-none flex items-center gap-2 pl-9 pr-8 py-1.5 border border-border-light dark:border-border-dark rounded bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm outline-none focus:ring-1 focus:ring-primary"
            >
              {directories.map(d => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
            <span className="material-icons text-slate-400 text-lg absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">folder_open</span>
            <span className="material-icons text-slate-400 text-lg absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">arrow_drop_down</span>
          </div>

          {/* Search Bar */}
          <div className="relative w-full max-w-sm group">
            <span className="material-icons absolute left-3 top-[7px] text-slate-400 text-lg pointer-events-none group-focus-within:text-primary transition-colors">search</span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-1.5 text-sm border-2 border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-0 outline-none transition-all placeholder-slate-400 shadow-sm"
              placeholder="Search initiatives... (Cmd+K)"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
            )}
            {searchResultsInfo && (
              <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark rounded-md shadow-lg text-xs text-slate-500 dark:text-slate-400 z-50">
                {searchResultsInfo}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 ml-2">
            <button
              onClick={onNewInitiative}
              className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-1.5 rounded shadow-sm flex items-center gap-1 transition-all"
            >
              <span className="material-icons text-lg">add</span>
              New Initiative
            </button>

            <button
              onClick={toggleDarkMode}
              className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <span className="material-icons text-xl">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
