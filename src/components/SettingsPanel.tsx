import { EfficiencyStats, clearTokenHistory, calculateEfficiency } from '../core/tokenTracker';
import { clearHistory } from '../core/contextManager';
import { clearUndoStack } from '../core/undoStack';
import { useState } from 'react';

export default function SettingsPanel({ efficiency }: { efficiency: EfficiencyStats | null }) {
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const handleClear = (type: string) => {
    switch (type) {
      case 'tokens':
        clearTokenHistory();
        break;
      case 'history':
        clearHistory();
        break;
      case 'undo':
        clearUndoStack();
        break;
    }
    setShowConfirm(null);
    window.location.reload();
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-xl font-semibold mb-6 text-gray-100">⚙️ Einstellungen</h2>

      {/* KI-Effizienz Panel */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🤖</span>
          <h3 className="text-base font-medium text-gray-200">KI-Effizienz</h3>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Aktiv
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Parser-Hit-Rate</p>
            <p className="text-2xl font-bold text-emerald-400">{efficiency?.parserHitRate.toFixed(1) || 0}%</p>
            <p className="text-xs text-gray-600 mt-1">Ziel: ≥70%</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Token-Reduktion</p>
            <p className="text-2xl font-bold text-cyan-400">{efficiency?.reductionPercent.toFixed(1) || 0}%</p>
            <p className="text-xs text-gray-600 mt-1">Ziel: ≥60%</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Ø Tokens/Request</p>
            <p className="text-2xl font-bold text-gray-100">{efficiency?.avgTokensPerRequest || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Baseline: ~800</p>
          </div>
        </div>

        {/* Pipeline Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400">Pipeline-Konfiguration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ConfigItem label="System-Prompt" value="~150 Tokens (fix)" />
            <ConfigItem label="Max History" value="6 Nachrichten" />
            <ConfigItem label="Max Tokens (Chat)" value="300" />
            <ConfigItem label="Max Tokens (Confirm)" value="150" />
            <ConfigItem label="Temperature" value="0.3" />
            <ConfigItem label="Tool-Routing" value="3-8 von 20 Tools" />
            <ConfigItem label="History-Limit" value="<300 Zeichen/Nachricht" />
            <ConfigItem label="Response Format" value="JSON (wo möglich)" />
          </div>
        </div>

        {/* Token Usage Breakdown */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Nutzung nach Intent</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs">
                  <th className="text-left pb-2">Kategorie</th>
                  <th className="text-right pb-2">Anfragen</th>
                  <th className="text-right pb-2">Parser-Hits</th>
                  <th className="text-right pb-2">Tokens</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {efficiency && Object.entries(efficiency.byCategory).map(([cat, data]) => (
                  <tr key={cat} className="border-t border-gray-800">
                    <td className="py-2 capitalize">{cat}</td>
                    <td className="py-2 text-right font-mono">{data.count}</td>
                    <td className="py-2 text-right font-mono text-emerald-400">{data.parserHits}</td>
                    <td className="py-2 text-right font-mono">{data.tokens}</td>
                  </tr>
                ))}
                {(!efficiency || Object.keys(efficiency.byCategory).length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">Noch keine Daten</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Architecture Info */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6">
        <h3 className="text-base font-medium text-gray-200 mb-4">🏗️ Architektur</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-gray-400">✅ Repository-Pattern (kein direkter DB-Zugriff)</p>
            <p className="text-gray-400">✅ Zod-Validierung (Schema-basiert)</p>
            <p className="text-gray-400">✅ Lazy Loading (Code-Splitting)</p>
            <p className="text-gray-400">✅ Undo-Stack (50 Einträge)</p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-400">✅ Router-first Pipeline (70% offline)</p>
            <p className="text-gray-400">✅ Kompakter System-Prompt (~150 Tokens)</p>
            <p className="text-gray-400">✅ Dynamisches Tool-Routing</p>
            <p className="text-gray-400">✅ Kontext-Fenster-Hygiene</p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h3 className="text-base font-medium text-gray-200 mb-4">🗑️ Daten verwalten</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowConfirm('tokens')}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
          >
            Token-History löschen
          </button>
          <button
            onClick={() => setShowConfirm('history')}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
          >
            Chat-Verlauf löschen
          </button>
          <button
            onClick={() => setShowConfirm('undo')}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
          >
            Undo-Stack leeren
          </button>
        </div>

        {showConfirm && (
          <div className="mt-4 p-3 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-between">
            <span className="text-sm text-gray-300">Wirklich löschen? Dies kann nicht rückgängig gemacht werden.</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(null)}
                className="px-3 py-1 rounded text-sm text-gray-400 hover:text-gray-200"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleClear(showConfirm)}
                className="px-3 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-400"
              >
                Löschen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-300 font-mono">{value}</span>
    </div>
  );
}
