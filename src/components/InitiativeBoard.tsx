
import React, { useState } from 'react';
import { Initiative, InitiativeStatus } from '../types';

interface InitiativeBoardProps {
  initiatives: Initiative[];
  onSelect: (init: Initiative) => void;
  onUpdateInitiative: (init: Initiative) => void;
  showDirectoryBadge?: boolean;
}

const InitiativeBoard: React.FC<InitiativeBoardProps> = ({ initiatives, onSelect, onUpdateInitiative, showDirectoryBadge }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const columns = [
    { label: 'IDEA', status: InitiativeStatus.IDEA },
    { label: 'IN DISCOVERY', status: InitiativeStatus.IN_DISCOVERY },
    { label: 'IN PROGRESS', status: InitiativeStatus.IN_PROGRESS },
    { label: 'BLOCKED', status: InitiativeStatus.BLOCKED },
    { label: 'DELIVERED', status: InitiativeStatus.COMPLETED },
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('initiativeId', id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a ghost image or just set opacity via class
    setTimeout(() => {
      const el = e.target as HTMLElement;
      el.classList.add('opacity-40');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    setActiveColumn(null);
    const el = e.target as HTMLElement;
    el.classList.remove('opacity-40');
  };

  const handleDragOver = (e: React.DragEvent, status: InitiativeStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setActiveColumn(status);
  };

  const handleDragLeave = () => {
    setActiveColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: InitiativeStatus) => {
    e.preventDefault();
    setActiveColumn(null);
    const id = e.dataTransfer.getData('initiativeId');
    const initiative = initiatives.find(i => i.id === id);
    
    if (initiative && initiative.status !== newStatus) {
      onUpdateInitiative({ ...initiative, status: newStatus });
    }
  };

  return (
    <div className="flex h-full overflow-x-auto gap-6 pb-6 select-none">
      {columns.map((column) => {
        const columnInitiatives = initiatives.filter(i => i.status === column.status);
        const isActive = activeColumn === column.status;
        
        return (
          <div 
            key={column.label} 
            className={`flex-shrink-0 w-72 flex flex-col rounded-xl transition-colors duration-200 ${
              isActive ? 'bg-slate-100/50 dark:bg-slate-800/30 ring-2 ring-primary ring-inset' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 border-b-2 border-slate-200 dark:border-slate-700 pb-2 px-1">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                {column.label}
              </h3>
              <span className="flex items-center justify-center w-5 h-5 bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-full">
                {columnInitiatives.length}
              </span>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-3 min-h-[200px] px-1">
              {columnInitiatives.map((init) => (
                <div
                  key={init.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, init.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelect(init)}
                  className={`bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group ${
                    draggedId === init.id ? 'opacity-40 ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-400 mb-1">{init.id}</div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight mb-2 group-hover:text-primary transition-colors">
                    {init.title}
                  </h4>
                  
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="inline-block bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200 dark:border-slate-600">
                      {init.type.split(' / ')[0]}
                    </span>
                    {init.directory && (
                      <span className="inline-flex items-center gap-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-medium border border-purple-200 dark:border-purple-700">
                        <span className="material-icons" style={{ fontSize: '10px' }}>folder</span>
                        {init.directory}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-700/50 pt-3">
                    <div className="flex items-center gap-1.5 text-red-500 font-medium text-[11px]">
                      <span className="material-icons text-sm">alarm</span>
                      {init.targetDeadline}
                    </div>
                    
                    {init.blockersCount ? (
                      <div className="flex items-center gap-1.5 text-orange-500 font-medium text-[11px]">
                        <span className="material-icons text-sm">warning</span>
                        {init.blockersCount} blockers
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              
              {columnInitiatives.length === 0 && !isActive && (
                <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center">
                   <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Empty</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InitiativeBoard;
