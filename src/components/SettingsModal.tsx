import React, { useState, useEffect } from 'react';
import { X, Download, Upload, RotateCcw, Key, Check, Archive, HardDrive, RefreshCw } from 'lucide-react';
import {
  exportAyuDatabase,
  importAyuDatabase,
  createWeeklySnapshot,
  restoreWeeklySnapshot,
  getMainStorageTelemetry,
  db,
} from '../db';
import { initializeDatabaseSeed } from '../db/seed';
import { WeeklySnapshot } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onRefresh }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('ayu_gemini_api_key') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Two-Tier Storage State
  const [snapshots, setSnapshots] = useState<WeeklySnapshot[]>([]);
  const [storageStats, setStorageStats] = useState<{
    mainBytes: number;
    snapshotBytes: number;
    imageAttachments: number;
    snapshotCount: number;
  }>({ mainBytes: 0, snapshotBytes: 0, imageAttachments: 0, snapshotCount: 0 });
  const [isSnapshotting, setIsSnapshotting] = useState(false);

  const loadStorageInfo = async () => {
    const list = await db.weekly_snapshots.orderBy('created_at').reverse().toArray();
    setSnapshots(list);
    const stats = await getMainStorageTelemetry();
    setStorageStats(stats);
  };

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('ayu_gemini_api_key', apiKey.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCreateSnapshot = async () => {
    setIsSnapshotting(true);
    try {
      await createWeeklySnapshot();
      await loadStorageInfo();
      setImportStatus('Compressed weekly snapshot created safely in local storage.');
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: any) {
      setImportStatus(`Snapshot failed: ${err.message}`);
    } finally {
      setIsSnapshotting(false);
    }
  };

  const handleRestoreSnapshot = async (id?: number) => {
    if (!id) return;
    if (confirm('Restore this weekly snapshot into your main working set?')) {
      try {
        await restoreWeeklySnapshot(id);
        onRefresh();
        await loadStorageInfo();
        setImportStatus('Restored snapshot into working memory.');
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err: any) {
        setImportStatus(`Restore failed: ${err.message}`);
      }
    }
  };

  const handleExportBackup = async () => {
    const jsonStr = await exportAyuDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayu_full_vault_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await importAyuDatabase(text);
        setImportStatus('Complete database restored.');
        onRefresh();
        await loadStorageInfo();
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err: any) {
        setImportStatus(`Restore failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset Ayu database to clean default seed data?')) {
      await initializeDatabaseSeed(true);
      onRefresh();
      onClose();
    }
  };

  const formatKB = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-cream-100 border border-cream-200 rounded-3xl p-5 shadow-2xl my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-ink">Settings & Vault</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white border border-cream-200 text-ink-mute hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
          {/* Storage Tiers */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white p-3 rounded-2xl border border-cream-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink-mute mb-1">
                <HardDrive size={15} className="text-coral" />
                <span>Main</span>
              </div>
              <b className="text-base font-mono text-ink block">{formatKB(storageStats.mainBytes)}</b>
              <span className="text-xs text-coral font-medium">
                {storageStats.imageAttachments} photos
              </span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-cream-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink-mute mb-1">
                <Archive size={15} className="text-sky" />
                <span>Archive</span>
              </div>
              <b className="text-base font-mono text-ink block">{formatKB(storageStats.snapshotBytes)}</b>
              <span className="text-xs text-sky font-medium">
                {storageStats.snapshotCount} snapshots
              </span>
            </div>
          </div>

          {/* Snapshots */}
          <div className="bg-white p-3.5 rounded-2xl border border-cream-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink flex items-center gap-1.5">
                <Archive size={16} className="text-sky" />
                <span>Snapshots</span>
              </span>
              <button
                onClick={handleCreateSnapshot}
                disabled={isSnapshotting}
                className="px-3 py-1.5 bg-coral hover:bg-coral-hover text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSnapshotting ? 'Saving...' : '+ Snapshot'}
              </button>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-2.5 text-center border border-dashed border-cream-200 rounded-xl text-xs text-ink-mute">
                No snapshots yet
              </div>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {snapshots.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 bg-cream-100 border border-cream-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <b className="text-ink block text-[13px] leading-tight">{s.week_label}</b>
                      <span className="text-xs font-mono text-ink-mute">
                        {formatKB(s.compressed_bytes)} · {s.ratio_percent}%
                      </span>
                    </div>
                    <button
                      onClick={() => handleRestoreSnapshot(s.id)}
                      className="px-2.5 py-1 bg-white border border-cream-200 text-sky hover:text-ink rounded-lg text-xs font-bold"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backup Export/Import */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleExportBackup}
              className="py-3 px-3 bg-white hover:bg-cream-200/40 border border-cream-200 rounded-2xl text-[13px] font-bold text-ink flex items-center justify-center gap-2 shadow-xs"
            >
              <Download size={16} className="text-sky" />
              <span>Export</span>
            </button>

            <label className="py-3 px-3 bg-white hover:bg-cream-200/40 border border-cream-200 rounded-2xl text-[13px] font-bold text-ink flex items-center justify-center gap-2 cursor-pointer shadow-xs">
              <Upload size={16} className="text-coral" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>

          {importStatus && (
            <div className="text-xs font-mono text-center p-2.5 rounded-xl bg-white border border-cream-200 text-ink">
              {importStatus}
            </div>
          )}

          {/* Gemini API Key */}
          <div className="bg-white p-3.5 rounded-2xl border border-cream-200 space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <Key size={16} className="text-sun" />
              <span>Gemini API Key</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink font-mono focus:border-coral focus:outline-none"
              />
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl text-sm transition-colors"
              >
                {savedSuccess ? <Check size={16} /> : 'Save'}
              </button>
            </div>
          </div>

          {/* Clear All Data */}
          <button
            onClick={handleResetDefaults}
            className="w-full py-3 bg-white hover:bg-rose-light border border-cream-200 hover:border-rose text-ink-mute hover:text-rose rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={16} />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
