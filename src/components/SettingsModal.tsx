import React, { useState } from 'react';
import { X, Download, Upload, RotateCcw, Key, Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Settings & Backup</h3>
            <span className="text-xs font-mono text-slate-500">Local-first privacy engine</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Database Backup & Restore */}
        <div className="mb-5 pb-5 border-b border-slate-200">
          <h4 className="text-xs font-mono uppercase font-semibold text-slate-600 mb-2.5">
            One-Tap Database Backup & Restore
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportBackup}
              className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Download size={14} className="text-sky-600" />
              <span>Export DB (JSON)</span>
            </button>

            <label className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs">
              <Upload size={14} className="text-emerald-600" />
              <span>Restore DB</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>

          {importStatus && (
            <div className="mt-2 text-xs font-mono text-center p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
              {importStatus}
            </div>
          )}
        </div>

        {/* Gemini API Key */}
        <div className="mb-5 pb-5 border-b border-slate-200">
          <h4 className="text-xs font-mono uppercase font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Key size={13} className="text-amber-600" />
            <span>Gemini API Key (Optional Multimodal Intake)</span>
          </h4>
          <p className="text-[11px] text-slate-500 mb-2">
            Stored strictly in local on-device storage. Used only for AI meal photo and description parsing on cache misses.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:border-amber-600 focus:outline-none"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              {savedSuccess ? <Check size={14} /> : 'Save'}
            </button>
          </div>
        </div>

        {/* Reset to Seed */}
        <div>
          <button
            onClick={handleResetDefaults}
            className="w-full py-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset to Clean Demo Seed Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
