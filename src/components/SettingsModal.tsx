import React, { useState } from 'react';
import { X, Download, Upload, RotateCcw, Key, Check, AlertCircle } from 'lucide-react';
import { exportAyuDatabase, importAyuDatabase } from '../db';
import { initializeDatabaseSeed } from '../db/seed';

interface SettingsModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onRefresh }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('ayu_gemini_api_key') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveApiKey = () => {
    localStorage.setItem('ayu_gemini_api_key', apiKey.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportBackup = async () => {
    const jsonStr = await exportAyuDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayu_backup_${new Date().toISOString().slice(0, 10)}.json`;
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
        setImportStatus('Backup restored successfully.');
        onRefresh();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-obsidian-900 border border-obsidian-700 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Settings & Data Management</h3>
            <span className="text-xs font-mono text-slate-400">Local-first privacy engine</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Database Backup & Restore */}
        <div className="mb-5 pb-5 border-b border-obsidian-800">
          <h4 className="text-xs font-mono uppercase text-slate-400 mb-2.5">
            One-Tap Database Backup & Restore
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportBackup}
              className="py-2.5 px-3 bg-obsidian-800 hover:bg-obsidian-700 border border-obsidian-700 rounded-xl text-xs font-mono text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download size={14} className="text-accent-cyan" />
              <span>Export DB (JSON)</span>
            </button>

            <label className="py-2.5 px-3 bg-obsidian-800 hover:bg-obsidian-700 border border-obsidian-700 rounded-xl text-xs font-mono text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
              <Upload size={14} className="text-accent-emerald" />
              <span>Restore DB</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>

          {importStatus && (
            <div className="mt-2 text-xs font-mono text-center p-2 rounded-lg bg-obsidian-950 border border-obsidian-800 text-slate-300">
              {importStatus}
            </div>
          )}
        </div>

        {/* Gemini API Key */}
        <div className="mb-5 pb-5 border-b border-obsidian-800">
          <h4 className="text-xs font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Key size={13} className="text-accent-amber" />
            <span>Gemini API Key (Optional Multimodal Intake)</span>
          </h4>
          <p className="text-[11px] text-slate-400 mb-2">
            Stored strictly in local on-device storage. Used only for AI meal photo and description parsing on cache misses.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 bg-obsidian-950 border border-obsidian-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-accent-amber focus:outline-none"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-3.5 py-2 bg-accent-amber hover:bg-amber-400 text-obsidian-950 font-bold rounded-xl text-xs transition-colors"
            >
              {savedSuccess ? <Check size={14} /> : 'Save'}
            </button>
          </div>
        </div>

        {/* Reset to Seed */}
        <div>
          <button
            onClick={handleResetDefaults}
            className="w-full py-2.5 bg-obsidian-950 hover:bg-red-950/40 border border-obsidian-800 hover:border-red-800/40 text-slate-400 hover:text-red-400 rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset to Clean Demo Seed Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
