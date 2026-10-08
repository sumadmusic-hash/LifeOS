import { TokenUsage, IntentCategory } from '../types';

const STORAGE_KEY = 'lifeos_token_usage';
const MAX_ENTRIES = 500;

// Approximate token counting (1 token ≈ 4 chars for German, ~3.5 for English)
export function countTokens(text: string): number {
  // Simple heuristic: German text averages ~3.5 chars per token
  return Math.ceil(text.length / 3.5);
}

export function getTokenUsage(): TokenUsage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function recordTokenUsage(usage: Omit<TokenUsage, 'id' | 'timestamp'>): void {
  const entries = getTokenUsage();
  const entry: TokenUsage = {
    ...usage,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  entries.push(entry);

  // Keep only last MAX_ENTRIES
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export interface EfficiencyStats {
  totalRequests: number;
  parserHits: number;
  parserMisses: number;
  parserHitRate: number;
  totalTokens: number;
  tokensSavedByParser: number;
  estimatedBaselineTokens: number;
  reductionPercent: number;
  avgTokensPerRequest: number;
  byCategory: Record<string, { count: number; tokens: number; parserHits: number }>;
  last24hTokens: number;
  last24hRequests: number;
}

export function calculateEfficiency(): EfficiencyStats {
  const entries = getTokenUsage();
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;

  // Estimated baseline: every request would go to AI with full context
  // Baseline average: ~800 tokens per request (system prompt + history + tools)
  const BASELINE_TOKENS_PER_REQUEST = 800;

  let totalTokens = 0;
  let parserHits = 0;
  let parserMisses = 0;
  let last24hTokens = 0;
  let last24hRequests = 0;

  const byCategory: Record<string, { count: number; tokens: number; parserHits: number }> = {};

  for (const entry of entries) {
    totalTokens += entry.totalTokens;

    if (entry.parserHit) {
      parserHits++;
    } else {
      parserMisses++;
    }

    if (entry.timestamp >= last24h) {
      last24hTokens += entry.totalTokens;
      last24hRequests++;
    }

    if (!byCategory[entry.intent]) {
      byCategory[entry.intent] = { count: 0, tokens: 0, parserHits: 0 };
    }
    byCategory[entry.intent].count++;
    byCategory[entry.intent].tokens += entry.totalTokens;
    if (entry.parserHit) {
      byCategory[entry.intent].parserHits++;
    }
  }

  const totalRequests = entries.length;
  const estimatedBaselineTokens = totalRequests * BASELINE_TOKENS_PER_REQUEST;
  const tokensSavedByParser = parserHits * BASELINE_TOKENS_PER_REQUEST; // Parser hits use 0 tokens
  const reductionPercent = estimatedBaselineTokens > 0
    ? ((estimatedBaselineTokens - totalTokens) / estimatedBaselineTokens) * 100
    : 0;

  return {
    totalRequests,
    parserHits,
    parserMisses,
    parserHitRate: totalRequests > 0 ? (parserHits / totalRequests) * 100 : 0,
    totalTokens,
    tokensSavedByParser,
    estimatedBaselineTokens,
    reductionPercent: Math.max(0, reductionPercent),
    avgTokensPerRequest: totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
    byCategory,
    last24hTokens,
    last24hRequests,
  };
}

export function clearTokenHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
