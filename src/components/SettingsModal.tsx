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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-white border border-cream-200 rounded-3xl p-6 shadow-2xl my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-ink">Settings & Storage Vault</h3>
            <span className="text-xs font-mono text-ink-mute">Two-Tier Local Memory Architecture</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-ink-mute hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Two-Tier Storage Architecture Overview */}
          <div className="p-3.5 bg-cream-100 rounded-2xl border border-cream-200">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive size={16} className="text-coral" />
              <b className="text-xs font-bold text-ink uppercase">Storage Tiers Status</b>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white p-2.5 rounded-xl border border-cream-200">
                <span className="text-[10px] text-ink-mute block uppercase">Set 1: Main Memory</span>
                <b className="text-ink text-sm block">{formatKB(storageStats.mainBytes)}</b>
                <span className="text-[9px] text-coral font-medium">
                  {storageStats.imageAttachments} photos cached
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-cream-200">
                <span className="text-[10px] text-ink-mute block uppercase">Set 2: Weekly Archive</span>
                <b className="text-ink text-sm block">{formatKB(storageStats.snapshotBytes)}</b>
                <span className="text-[9px] text-sky font-medium">
                  {storageStats.snapshotCount} compressed snapshots
                </span>
              </div>
            </div>
          </div>

          {/* Weekly Compressed Snapshots Manager */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-mono uppercase font-bold text-ink-mute flex items-center gap-1.5">
                <Archive size={14} className="text-sky" />
                <span>Compressed Weekly Snapshots</span>
              </h4>
              <button
                onClick={handleCreateSnapshot}
                disabled={isSnapshotting}
                className="px-2.5 py-1 bg-coral hover:bg-coral-hover text-white rounded-lg text-[10px] font-bold font-mono transition-colors disabled:opacity-50"
              >
                {isSnapshotting ? 'Compressing...' : '+ Snapshot Now'}
              </button>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-3 text-center border border-dashed border-cream-200 rounded-xl text-xs text-ink-mute font-mono">
                No weekly snapshots yet. Tap '+ Snapshot Now' to compress and archive.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {snapshots.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 bg-cream-100 border border-cream-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <b className="text-ink block text-[11px] leading-tight">{s.week_label}</b>
                      <span className="text-[10px] font-mono text-ink-mute">
                        {formatKB(s.compressed_bytes)} (was {formatKB(s.original_bytes)}) · {s.ratio_percent}% ratio
                      </span>
                    </div>

                    <button
                      onClick={() => handleRestoreSnapshot(s.id)}
                      className="px-2 py-1 bg-white hover:bg-cream-200 border border-cream-200 text-sky hover:text-ink rounded-lg font-mono text-[10px] font-bold transition-colors"
                      title="Restore working set to this snapshot"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Database Backup Export/Import */}
          <div className="pt-3 border-t border-cream-200">
            <h4 className="text-xs font-mono uppercase font-bold text-ink-mute mb-2">
              Vault Export & Import
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportBackup}
                className="py-2.5 px-3 bg-white hover:bg-cream-100 border border-cream-200 rounded-xl text-xs font-mono font-bold text-ink flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download size={14} className="text-sky" />
                <span>Export JSON</span>
              </button>

              <label className="py-2.5 px-3 bg-white hover:bg-cream-100 border border-cream-200 rounded-xl text-xs font-mono font-bold text-ink flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs">
                <Upload size={14} className="text-coral" />
                <span>Restore JSON</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>

            {importStatus && (
              <div className="mt-2 text-xs font-mono text-center p-2 rounded-lg bg-cream-100 border border-cream-200 text-ink">
                {importStatus}
              </div>
            )}
          </div>

          {/* Gemini API Key */}
          <div className="pt-3 border-t border-cream-200">
            <h4 className="text-xs font-mono uppercase font-bold text-ink-mute mb-1 flex items-center gap-1.5">
              <Key size={13} className="text-sun" />
              <span>Gemini API Key (Optional AI Parser)</span>
            </h4>
            <p className="text-[11px] text-ink-mute mb-2">
              Used strictly on cache misses for novel meal photo/voice parsing. Stored locally.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-xs text-ink font-mono focus:border-coral focus:outline-none"
              />
              <button
                onClick={handleSaveApiKey}
                className="px-3.5 py-2 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                {savedSuccess ? <Check size={14} /> : 'Save'}
              </button>
            </div>
          </div>

          {/* Reset to Seed */}
          <div className="pt-3 border-t border-cream-200">
            <button
              onClick={handleResetDefaults}
              className="w-full py-2.5 bg-cream-100 hover:bg-rose-light border border-cream-200 hover:border-rose text-ink-mute hover:text-rose rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw size={14} />
              <span>Reset to Clean Demo Seed Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
