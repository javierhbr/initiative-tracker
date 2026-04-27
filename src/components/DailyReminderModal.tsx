import React, { useState } from 'react';
import type { ReminderCheckResponse, ReminderItem } from '../types';
import { postReminderAction, fetchRemindersDaily } from '../api';

interface DailyReminderModalProps {
  data: ReminderCheckResponse;
  onClose: () => void;
  onRefresh: (data: ReminderCheckResponse) => void;
}

const DailyReminderModal: React.FC<DailyReminderModalProps> = ({ data, onClose, onRefresh }) => {
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: 'done' | 'snooze' | 'dismiss', itemId: string) => {
    setActing(itemId);
    setError(null);
    try {
      await postReminderAction(action, itemId);
      const updated = await fetchRemindersDaily();
      onRefresh(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActing(null);
    }
  };

  const pendingItems = data.items.filter(i => !i.overdue);
  const overdueItems = data.items.filter(i => i.overdue);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-icons text-primary text-2xl">notifications_active</span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Daily Follow-ups</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {data.pendingCount} pending item{data.pendingCount !== 1 ? 's' : ''} across your initiatives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <span className="material-icons text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {data.items.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <span className="material-icons text-4xl mb-2 block">check_circle</span>
              <p className="text-sm">All caught up! No pending follow-ups.</p>
            </div>
          )}

          {overdueItems.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400 mb-2 flex items-center gap-1">
                <span className="material-icons text-sm">warning</span>
                Overdue / Needs Attention ({overdueItems.length})
              </h3>
              <div className="space-y-2">
                {overdueItems.map(item => (
                  <ReminderItemRow
                    key={item.id}
                    item={item}
                    acting={acting}
                    onAction={handleAction}
                  />
                ))}
              </div>
            </div>
          )}

          {pendingItems.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Pending Follow-ups ({pendingItems.length})
              </h3>
              <div className="space-y-2">
                {pendingItems.map(item => (
                  <ReminderItemRow
                    key={item.id}
                    item={item}
                    acting={acting}
                    onAction={handleAction}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex justify-between items-center">
          {data.snoozeActive && data.snoozedUntil && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span className="material-icons text-sm">snooze</span>
              Snoozed until {new Date(data.snoozedUntil).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {!data.snoozeActive && <div />}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface ReminderItemRowProps {
  item: ReminderItem;
  acting: string | null;
  onAction: (action: 'done' | 'snooze' | 'dismiss', itemId: string) => void;
}

const ReminderItemRow: React.FC<ReminderItemRowProps> = ({ item, acting, onAction }) => {
  const isActing = acting === item.id;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${
      item.overdue
        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
        : 'border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50'
    }`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary font-mono mb-0.5">{item.initiativeId}</p>
        <p className="text-sm text-slate-700 dark:text-slate-200">{item.text}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isActing ? (
          <span className="material-icons animate-spin text-slate-400 text-lg">refresh</span>
        ) : (
          <>
            <button
              onClick={() => onAction('done', item.id)}
              className="px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              title="Mark done"
            >
              Done
            </button>
            <button
              onClick={() => onAction('snooze', item.id)}
              className="px-2 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              title="Snooze"
            >
              Snooze
            </button>
            <button
              onClick={() => onAction('dismiss', item.id)}
              className="px-2 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              title="Dismiss for today"
            >
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyReminderModal;
