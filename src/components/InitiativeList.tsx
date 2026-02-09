
import React from 'react';
import { Initiative, InitiativeStatus } from '../types';

interface InitiativeListProps {
  initiatives: Initiative[];
  onSelect: (init: Initiative) => void;
}

const InitiativeList: React.FC<InitiativeListProps> = ({ initiatives, onSelect }) => {
  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">All Initiatives</h1>
      </div>

      <div className="space-y-4">
        {initiatives.map(init => (
          <div 
            key={init.id}
            onClick={() => onSelect(init)}
            className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="w-full">
                  <div className="text-xs font-mono text-slate-400 mb-1">{init.id}</div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-primary transition-colors">
                    {init.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                      init.status === InitiativeStatus.IN_DISCOVERY 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {init.status}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                      {init.type}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 pt-4 border-t border-border-light dark:border-border-dark text-sm mt-2">
                {init.blockersCount ? (
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                    <span className="material-icons text-base">warning</span>
                    {init.blockersCount} blockers
                  </div>
                ) : null}

                {init.targetDeadline && (
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="material-icons text-base">calendar_today</span>
                    Deadline: {init.targetDeadline}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {initiatives.length === 0 && (
          <div className="text-center py-12 bg-surface-light dark:bg-surface-dark border border-dashed border-border-light dark:border-border-dark rounded-lg">
            <span className="material-icons text-slate-300 text-4xl mb-2">search_off</span>
            <p className="text-slate-500">No initiatives found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitiativeList;
