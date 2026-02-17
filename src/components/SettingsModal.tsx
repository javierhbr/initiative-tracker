
import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { fetchConfig, updateConfig } from '../api';

interface SettingsModalProps {
  onClose: () => void;
  onSaved: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSaved }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig()
      .then(c => { setConfig(c); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const handleServerChange = (field: 'host' | 'port', value: string) => {
    if (!config) return;
    setConfig({
      ...config,
      server: {
        ...config.server,
        [field]: field === 'port' ? parseInt(value) || 0 : value,
      },
    });
  };

  const handleDirChange = (index: number, field: 'name' | 'path', value: string) => {
    if (!config) return;
    const dirs = [...config.directories];
    dirs[index] = { ...dirs[index], [field]: value };
    setConfig({ ...config, directories: dirs });
  };

  const handleSetDefault = (index: number) => {
    if (!config) return;
    const dirs = config.directories.map((d, i) => ({ ...d, default: i === index }));
    setConfig({ ...config, directories: dirs });
  };

  const handleAddDirectory = () => {
    if (!config) return;
    setConfig({
      ...config,
      directories: [...config.directories, { name: '', path: './initiatives', default: false }],
    });
  };

  const handleRemoveDirectory = (index: number) => {
    if (!config) return;
    if (config.directories.length <= 1) return;
    const dirs = config.directories.filter((_, i) => i !== index);
    // If we removed the default, make first one default
    if (!dirs.some(d => d.default)) {
      dirs[0].default = true;
    }
    setConfig({ ...config, directories: dirs });
  };

  const handleSave = async () => {
    if (!config) return;

    // Validate
    for (const d of config.directories) {
      if (!d.name.trim() || !d.path.trim()) {
        setError('All directories must have a name and path.');
        return;
      }
    }
    const names = config.directories.map(d => d.name.trim());
    if (new Set(names).size !== names.length) {
      setError('Directory names must be unique.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateConfig(config);
      // Reload the page so the app picks up the new config
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-primary focus:border-primary outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-surface-dark w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-icons text-primary">settings</span>
            Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <span className="material-icons animate-spin mr-2">refresh</span>
              Loading config...
            </div>
          ) : config ? (
            <div className="grid grid-cols-5 gap-6">
              {/* Left column: Server + Initiative Types */}
              <div className="col-span-2 space-y-6">
                {/* Server Section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Server</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Host</label>
                      <input
                        value={config.server.host}
                        onChange={(e) => handleServerChange('host', e.target.value)}
                        className={inputClass}
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Port</label>
                      <input
                        type="number"
                        value={config.server.port}
                        onChange={(e) => handleServerChange('port', e.target.value)}
                        className={inputClass}
                        placeholder="3939"
                      />
                    </div>
                  </div>
                </div>

                {/* Initiative Types Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Initiative Types</h3>
                    <button
                      onClick={() => {
                        if (!config) return;
                        setConfig({ ...config, initiativeTypes: [...(config.initiativeTypes || []), ''] });
                      }}
                      className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1"
                    >
                      <span className="material-icons text-sm">add</span>
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(config.initiativeTypes || []).map((t, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          value={t}
                          onChange={(e) => {
                            const types = [...(config.initiativeTypes || [])];
                            types[index] = e.target.value;
                            setConfig({ ...config, initiativeTypes: types });
                          }}
                          className={`${inputClass} flex-1`}
                          placeholder="e.g., Discovery"
                        />
                        <button
                          onClick={() => {
                            const types = (config.initiativeTypes || []).filter((_, i) => i !== index);
                            setConfig({ ...config, initiativeTypes: types });
                          }}
                          className="text-red-400 hover:text-red-600 shrink-0"
                        >
                          <span className="material-icons text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column: Directories */}
              <div className="col-span-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Directories</h3>
                  <button
                    onClick={handleAddDirectory}
                    className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1"
                  >
                    <span className="material-icons text-sm">add</span>
                    Add
                  </button>
                </div>

                <div className="space-y-3">
                  {config.directories.map((dir, index) => (
                    <div key={index} className="p-3 rounded-lg border border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Name</label>
                          <input
                            value={dir.name}
                            onChange={(e) => handleDirChange(index, 'name', e.target.value)}
                            className={inputClass}
                            placeholder="e.g., Personal"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Path</label>
                          <input
                            value={dir.path}
                            onChange={(e) => handleDirChange(index, 'path', e.target.value)}
                            className={`${inputClass} font-mono text-xs`}
                            placeholder="./initiatives"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                          <input
                            type="radio"
                            name="default-dir"
                            checked={dir.default}
                            onChange={() => handleSetDefault(index)}
                            className="accent-primary"
                          />
                          Default directory
                        </label>
                        {config.directories.length > 1 && (
                          <button
                            onClick={() => handleRemoveDirectory(index)}
                            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                          >
                            <span className="material-icons text-sm">delete_outline</span>
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
              {successMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 font-medium hover:text-slate-700 dark:hover:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded shadow-sm hover:bg-primary-dark transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
