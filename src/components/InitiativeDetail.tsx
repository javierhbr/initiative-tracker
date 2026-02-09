
import React, { useState, useEffect } from 'react';
import { TabName, ServerInitiativeDetail } from '../types';
import { fetchInitiativeDetail, addNote, addComm, updateFile } from '../api';
import { marked } from 'marked';

interface InitiativeDetailProps {
  initiativeId: string;
  directory: string | null;
  onBack: () => void;
}

const TAB_LABELS: Record<TabName, string> = {
  readme: 'Overview',
  notes: 'Notes',
  comms: 'Communications',
  links: 'Links',
};

const InitiativeDetail: React.FC<InitiativeDetailProps> = ({ initiativeId, directory, onBack }) => {
  const [detail, setDetail] = useState<ServerInitiativeDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('readme');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  // Add note modal
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // Add comm modal
  const [isAddingComm, setIsAddingComm] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInitiativeDetail(initiativeId, directory || undefined);
      setDetail(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [initiativeId, directory]);

  const handleStartEdit = () => {
    if (!detail) return;
    setEditContent(detail[activeTab]);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateFile(initiativeId, activeTab, editContent, directory || undefined);
      await loadDetail();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      await addNote(initiativeId, noteContent, directory || undefined);
      await loadDetail();
      setIsAddingNote(false);
      setNoteContent('');
      setActiveTab('notes');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddComm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addComm(initiativeId, {
        channel: formData.get('channel') as string,
        link: formData.get('link') as string,
        context: formData.get('context') as string,
        directory: directory || undefined,
      });
      await loadDetail();
      setIsAddingComm(false);
      setActiveTab('comms');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const tabs: TabName[] = ['readme', 'notes', 'comms', 'links'];

  if (loading) {
    return (
      <div className="max-w-6xl">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium mb-6 transition-all">
          <span className="material-icons text-sm">arrow_back</span> Back to list
        </button>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 flex items-center gap-2">
            <span className="material-icons animate-spin">refresh</span>
            Loading initiative...
          </div>
        </div>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="max-w-6xl">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium mb-6 transition-all">
          <span className="material-icons text-sm">arrow_back</span> Back to list
        </button>
        <div className="text-center py-12 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium mb-6 transition-all"
      >
        <span className="material-icons text-sm">arrow_back</span> Back to list
      </button>

      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm min-h-[700px] overflow-hidden">
        {/* Header area */}
        <div className="px-6 pt-6 border-b border-border-light dark:border-border-dark">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                {initiativeId}
              </h2>
              <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded text-xs font-mono border border-slate-200 dark:border-slate-700">
                {directory || 'initiatives'}/{initiativeId}/README.md
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsAddingNote(true); setNoteContent(''); }}
                className="px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                + Add Note
              </button>
              <button
                onClick={() => setIsAddingComm(true)}
                className="px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                + Log Comm
              </button>
              {!isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="px-3 py-1.5 border border-border-light dark:border-border-dark rounded bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <span className="material-icons text-sm align-middle mr-1">edit</span>
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 -mb-px">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setIsEditing(false); }}
                className={`pb-4 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === tab
                    ? 'text-primary border-primary'
                    : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="bg-white dark:bg-surface-dark">
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {isEditing ? (
            <div className="p-6 animate-in fade-in duration-200">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-[500px] bg-slate-50 dark:bg-slate-800 border border-border-light dark:border-border-dark rounded-lg p-4 font-mono text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 bg-primary text-white font-bold rounded shadow-lg hover:bg-primary-dark transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none p-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
              dangerouslySetInnerHTML={{
                __html: marked.parse(detail?.[activeTab] || '*No content*') as string,
              }}
            />
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      {isAddingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="material-icons text-primary">note_add</span>
              Add Note
            </h2>
            <textarea
              autoFocus
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full h-40 bg-slate-50 dark:bg-slate-800 border border-border-light dark:border-border-dark rounded-lg p-4 font-mono text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none"
              placeholder="Write your note..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsAddingNote(false)}
                className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                className="px-6 py-2 bg-primary text-white font-bold rounded shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50"
                disabled={!noteContent.trim()}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comm Modal */}
      {isAddingComm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="material-icons text-primary">chat</span>
              Log Communication
            </h2>
            <form onSubmit={handleAddComm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Channel</label>
                <select
                  name="channel"
                  required
                  className="w-full rounded border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  <option>Slack</option>
                  <option>Email</option>
                  <option>Meeting</option>
                  <option>Jira</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link</label>
                <input
                  name="link"
                  required
                  className="w-full rounded border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Context</label>
                <input
                  name="context"
                  required
                  className="w-full rounded border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Brief description of the communication"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingComm(false)}
                  className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white font-bold rounded shadow-lg hover:bg-primary-dark transition-all"
                >
                  Log Communication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InitiativeDetail;
