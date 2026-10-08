// LifeOS Type Definitions
export interface Task {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  category?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCompleted?: string;
}

export interface FinanceEntry {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  progress: number;
  target: number;
  unit: string;
  deadline?: string;
}

// Intent & AI Types
export type IntentCategory =
  | 'task'
  | 'note'
  | 'habit'
  | 'finance'
  | 'goal'
  | 'search'
  | 'summary'
  | 'settings'
  | 'unknown';

export interface ParsedIntent {
  category: IntentCategory;
  action: 'create' | 'read' | 'update' | 'delete' | 'search' | 'summarize' | 'unknown';
  entities: string[];
  confidence: number;
  rawInput: string;
}

export interface ToolDefinition {
  name: string;
  category: IntentCategory;
  description: string;
  parameters: Record<string, string>;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  tokens?: number;
}

export interface TokenUsage {
  id: string;
  timestamp: number;
  model: string;
  intent: IntentCategory;
  parserHit: boolean;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latency: number;
}

export interface EvalResult {
  query: string;
  expectedIntent: IntentCategory;
  expectedAction: string;
  parsedIntent: ParsedIntent;
  parserHit: boolean;
  tokensUsed: number;
  qualityScore: number;
}

export interface UndoEntry {
  id: string;
  action: string;
  timestamp: number;
  data: any;
  entityType: string;
}
