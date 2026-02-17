
import React from 'react';
import { Initiative, InitiativeStatus } from '../types';
import { version } from '../package.json';

interface SidebarProps {
  initiatives: Initiative[];
  onSelectInitiative: (init: Initiative) => void;
  selectedInitiativeId?: string;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ initiatives, onSelectInitiative, selectedInitiativeId, onOpenSettings, onOpenHelp }) => {
  const totalCount = initiatives.length;
  const inProgressCount = initiatives.filter(i => i.status === InitiativeStatus.IN_PROGRESS).length;
  const blockedCount = initiatives.filter(i => i.status === InitiativeStatus.BLOCKED || i.blockersCount && i.blockersCount > 0).length;

  return (
    <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-shrink-0 hidden md:flex flex-col py-6 px-4 transition-colors duration-200">
      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-2">Dashboard</h3>
      <nav className="space-y-1">
        <a href="#" className="flex items-center justify-between px-2 py-2 text-sm font-medium text-primary bg-blue-50 dark:bg-blue-900/20 rounded-md group">
          <span>Total Initiatives</span>
          <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-bold shadow-sm">{totalCount}</span>
        </a>
        <a href="#" className="flex items-center justify-between px-2 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
          <span>In Progress</span>
          <span className="text-slate-400">{inProgressCount}</span>
        </a>
        <a href="#" className="flex items-center justify-between px-2 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
          <span>Blocked</span>
          <span className="text-orange-500 font-bold">{blockedCount}</span>
        </a>
      </nav>

      <div className="mt-8">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2">Recents</h3>
        <div className="space-y-1">
          {initiatives.slice(0, 3).map(init => (
            <button
              key={init.id}
              onClick={() => onSelectInitiative(init)}
              className={`w-full text-left px-2 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group ${
                selectedInitiativeId === init.id ? 'bg-slate-100 dark:bg-slate-800' : ''
              }`}
            >
              <div className={`text-xs font-medium truncate ${selectedInitiativeId === init.id ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                {init.title}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                {init.status}{init.type ? ` • ${init.type.split('/')[0]}` : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-border-light dark:border-border-dark space-y-1">
        <button
          onClick={onOpenHelp}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <span className="material-icons text-slate-500 text-base">help_outline</span>
          </div>
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Help</div>
        </button>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <span className="material-icons text-slate-500 text-base">settings</span>
          </div>
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Settings</div>
        </button>
        <div className="px-2 pt-2 text-[10px] text-slate-400 dark:text-slate-500">
          v{version}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
