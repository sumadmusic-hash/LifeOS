import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { processUserInput, PipelineResult } from './core/aiPipeline';
import { calculateEfficiency, EfficiencyStats } from './core/tokenTracker';
import { getChatHistory } from './core/contextManager';
import { popUndo } from './core/undoStack';
import { getToolCount } from './core/toolRouter';
import { AIMessage } from './types';

// Lazy-loaded panels
const SettingsPanel = lazy(() => import('./components/SettingsPanel'));
const EvalPanel = lazy(() => import('./components/EvalPanel'));

type View = 'chat' | 'dashboard' | 'settings' | 'eval';

export default function App() {
  const [view, setView] = useState<View>('chat');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<PipelineResult | null>(null);
  const [efficiency, setEfficiency] = useState<EfficiencyStats | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  useEffect(() => {
    setMessages(getChatHistory());
    setEfficiency(calculateEfficiency());
  }, [view]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage: AIMessage = {
      role: 'user',
      content: userMsg,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await processUserInput(userMsg);
      setLastResult(result);

      // Add assistant response
      const assistantMsg: AIMessage = {
        role: 'assistant',
        content: result.response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setEfficiency(calculateEfficiency());
    } catch (err) {
      const errorMsg: AIMessage = {
        role: 'assistant',
        content: '⚠️ Fehler bei der Verarbeitung. Bitte erneut versuchen.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }

    setIsLoading(false);
  };

  const handleUndo = () => {
    const entry = popUndo();
    if (entry) {
      const undoMsg: AIMessage = {
        role: 'assistant',
        content: `↩️ Rückgängig: ${entry.action} (${entry.entityType})`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, undoMsg]);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-gray-900">
            L
          </div>
          <h1 className="text-lg font-semibold text-gray-100">LifeOS</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Local-first
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {[
            { id: 'chat' as View, icon: '💬', label: 'Chat' },
            { id: 'dashboard' as View, icon: '📊', label: 'Dashboard' },
            { id: 'eval' as View, icon: '🧪', label: 'Eval' },
            { id: 'settings' as View, icon: '⚙️', label: 'Settings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                view === item.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {view === 'chat' && (
          <ChatView
            messages={messages}
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            isLoading={isLoading}
            lastResult={lastResult}
            handleUndo={handleUndo}
            messagesEndRef={messagesEndRef}
          />
        )}
        {view === 'dashboard' && <DashboardView efficiency={efficiency} />}
        {view === 'eval' && (
          <Suspense fallback={<LoadingFallback />}>
            <EvalPanel />
          </Suspense>
        )}
        {view === 'settings' && (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPanel efficiency={efficiency} />
          </Suspense>
        )}
      </main>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 py-1.5 border-t border-gray-800 bg-gray-900/80 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>🟢 Offline-ready</span>
          <span>Parser-Hit: {efficiency?.parserHitRate.toFixed(0) || 0}%</span>
          <span>Tools: {getToolCount()} (routing: 3-8/req)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Tokens gesamt: {efficiency?.totalTokens || 0}</span>
          <span className="text-emerald-400">↓{efficiency?.reductionPercent.toFixed(0) || 0}% vs Baseline</span>
        </div>
      </footer>
    </div>
  );
}

// Chat View Component
function ChatView({
  messages,
  input,
  setInput,
  handleSend,
  isLoading,
  lastResult,
  handleUndo,
  messagesEndRef,
}: {
  messages: AIMessage[];
  input: string;
  setInput: (v: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  lastResult: PipelineResult | null;
  handleUndo: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="text-4xl mb-4">🧠</div>
            <h2 className="text-xl font-medium text-gray-300 mb-2">Willkommen bei LifeOS</h2>
            <p className="text-sm max-w-md">
              Dein lokaler Lebensmanager. Stelle Aufgaben, tracke Habits, verwalte Finanzen – alles per natürlicher Sprache.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
              {[
                'Erstelle Aufgabe: Einkaufen',
                'Zeige meine Habits',
                'Budget-Status',
                'Tageszusammenfassung',
              ].map(example => (
                <button
                  key={example}
                  onClick={() => setInput(example)}
                  className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-left"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>Verarbeite…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pipeline Indicator */}
      {lastResult && (
        <div className="px-4 py-2 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className={`px-2 py-0.5 rounded ${lastResult.parserHit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {lastResult.parserHit ? '🟢 Parser-Hit' : '🔵 AI-Route'}
            </span>
            <span>Intent: {lastResult.intent.category}</span>
            <span>Tokens: {lastResult.tokensUsed}</span>
            <span>Tools: {lastResult.toolsSent}/{getToolCount()}</span>
            <span>Latenz: {lastResult.latency.toFixed(0)}ms</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
            title="Rückgängig"
          >
            ↩️
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Nachricht eingeben… (z.B. 'Erstelle Aufgabe: Einkaufen')"
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-medium transition-colors"
          >
            Senden
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100'
            : 'bg-gray-800 border border-gray-700 text-gray-200'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

// Dashboard View
function DashboardView({ efficiency }: { efficiency: EfficiencyStats | null }) {
  if (!efficiency) return <LoadingFallback />;

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-xl font-semibold mb-6 text-gray-100">📊 Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Anfragen gesamt" value={efficiency.totalRequests.toString()} icon="📨" />
        <StatCard label="Parser-Hit-Rate" value={`${efficiency.parserHitRate.toFixed(0)}%`} icon="🎯" color="emerald" />
        <StatCard label="Token-Reduktion" value={`${efficiency.reductionPercent.toFixed(0)}%`} icon="⬇️" color="cyan" />
        <StatCard label="Ø Tokens/Request" value={efficiency.avgTokensPerRequest.toString()} icon="📏" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Usage by Category */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Tokens nach Kategorie</h3>
          <div className="space-y-3">
            {Object.entries(efficiency.byCategory).map(([cat, data]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-gray-300 capitalize">{cat}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, (data.parserHits / Math.max(1, data.count)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">{data.count} req</span>
                </div>
              </div>
            ))}
            {Object.keys(efficiency.byCategory).length === 0 && (
              <p className="text-sm text-gray-500">Noch keine Daten. Sende eine Nachricht im Chat.</p>
            )}
          </div>
        </div>

        {/* Savings Overview */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Einsparungen</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Baseline (ohne Optimierung)</span>
              <span className="text-sm text-gray-300 font-mono">{efficiency.estimatedBaselineTokens.toLocaleString()} Tokens</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Tatsächlich verbraucht</span>
              <span className="text-sm text-emerald-400 font-mono">{efficiency.totalTokens.toLocaleString()} Tokens</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Durch Parser gespart</span>
              <span className="text-sm text-cyan-400 font-mono">{efficiency.tokensSavedByParser.toLocaleString()} Tokens</span>
            </div>
            <div className="border-t border-gray-800 pt-3 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-300">Gesamtreduktion</span>
              <span className="text-lg font-bold text-emerald-400">{efficiency.reductionPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Letzte 24h</h3>
        <div className="flex gap-6">
          <div>
            <span className="text-2xl font-bold text-gray-100">{efficiency.last24hRequests}</span>
            <p className="text-xs text-gray-500">Anfragen</p>
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-100">{efficiency.last24hTokens.toLocaleString()}</span>
            <p className="text-xs text-gray-500">Tokens</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'gray' }: { label: string; value: string; icon: string; color?: string }) {
  const colorClasses: Record<string, string> = {
    gray: 'border-gray-800',
    emerald: 'border-emerald-500/30',
    cyan: 'border-cyan-500/30',
  };

  return (
    <div className={`bg-gray-900 rounded-xl border ${colorClasses[color] || colorClasses.gray} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <span className="text-2xl font-bold text-gray-100">{value}</span>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center gap-3 text-gray-500">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span>Laden…</span>
      </div>
    </div>
  );
}
