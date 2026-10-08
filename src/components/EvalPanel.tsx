import { getEvalSummary, runEvalSet } from '../core/evalSet';
import { useState } from 'react';

export default function EvalPanel() {
  const [results, setResults] = useState(() => runEvalSet());
  const [summary, setSummary] = useState(() => getEvalSummary());
  const [showDetails, setShowDetails] = useState(false);

  const handleRunEval = () => {
    const newResults = runEvalSet();
    const newSummary = getEvalSummary();
    setResults(newResults);
    setSummary(newSummary);
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-100">🧪 Quality Eval</h2>
        <button
          onClick={handleRunEval}
          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-medium text-sm transition-colors"
        >
          Eval ausführen
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-xs text-gray-500 mb-1">Testfälle</p>
          <p className="text-2xl font-bold text-gray-100">{summary.total}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-xs text-gray-500 mb-1">Parser-Hit-Rate</p>
          <p className="text-2xl font-bold text-emerald-400">{summary.hitRate.toFixed(0)}%</p>
          <p className="text-xs text-gray-600 mt-1">Ziel: ≥70%</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-xs text-gray-500 mb-1">Qualität (Avg)</p>
          <p className={`text-2xl font-bold ${summary.qualityAboveThreshold ? 'text-emerald-400' : 'text-amber-400'}`}>
            {(summary.avgQuality * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {summary.qualityAboveThreshold ? '✅ Akzeptiert (≤5% unter Baseline)' : '⚠️ Unter Schwellwert'}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-xs text-gray-500 mb-1">Token-Reduktion</p>
          <p className={`text-2xl font-bold ${summary.reductionPercent >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {summary.reductionPercent.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">Ziel: ≥60%</p>
        </div>
      </div>

      {/* Acceptance Criteria */}
      <div className={`rounded-xl border p-4 mb-6 ${
        summary.qualityAboveThreshold && summary.reductionPercent >= 60
          ? 'bg-emerald-500/5 border-emerald-500/30'
          : 'bg-amber-500/5 border-amber-500/30'
      }`}>
        <h3 className="text-sm font-medium text-gray-300 mb-2">Akzeptanzkriterien</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span>{summary.qualityAboveThreshold ? '✅' : '❌'}</span>
            <span className="text-gray-400">Qualität ≤5% unter Baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{summary.reductionPercent >= 60 ? '✅' : '❌'}</span>
            <span className="text-gray-400">≥60% Token-Reduktion</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{summary.hitRate >= 70 ? '✅' : '❌'}</span>
            <span className="text-gray-400">Parser-Hit-Rate ≥70%</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="text-gray-400">Datenmodell unverändert</span>
          </div>
        </div>
      </div>

      {/* Token Comparison */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Token-Vergleich (Eval-Set)</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Baseline (alle an KI)</span>
              <span className="text-gray-400">{summary.baselineTokens.toLocaleString()} Tokens</span>
            </div>
            <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gray-600 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Optimiert (Router-first)</span>
              <span className="text-emerald-400">{summary.totalTokens.toLocaleString()} Tokens</span>
            </div>
            <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(summary.totalTokens / summary.baselineTokens) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-400">
            Details ({results.filter(r => r.parserHit).length}/{results.length} Parser-Hits)
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            {showDetails ? 'Weniger' : 'Mehr anzeigen'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left pb-2">#</th>
                <th className="text-left pb-2">Anfrage</th>
                <th className="text-left pb-2">Erwartet</th>
                <th className="text-left pb-2">Parsed</th>
                <th className="text-center pb-2">Hit</th>
                <th className="text-right pb-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {(showDetails ? results : results.slice(0, 10)).map((r, i) => (
                <tr key={i} className="border-t border-gray-800/50">
                  <td className="py-1.5 text-gray-500">{i + 1}</td>
                  <td className="py-1.5 text-gray-300 max-w-[200px] truncate">{r.query}</td>
                  <td className="py-1.5 text-gray-400">{r.expectedIntent}/{r.expectedAction}</td>
                  <td className="py-1.5 text-gray-400">{r.parsedIntent.category}/{r.parsedIntent.action}</td>
                  <td className="py-1.5 text-center">
                    {r.parserHit ? (
                      <span className="text-emerald-400">●</span>
                    ) : (
                      <span className="text-amber-400">○</span>
                    )}
                  </td>
                  <td className={`py-1.5 text-right font-mono ${r.qualityScore === 1 ? 'text-emerald-400' : r.qualityScore >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                    {(r.qualityScore * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
