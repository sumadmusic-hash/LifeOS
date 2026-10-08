import { AIMessage } from '../types';
import { countTokens } from './tokenTracker';

const MAX_HISTORY_MESSAGES = 6;
const MAX_MESSAGE_LENGTH = 300;
const STORAGE_KEY = 'lifeos_chat_history';
const SUMMARY_KEY = 'lifeos_chat_summary';

// Compact system prompt - max ~150 tokens
export const SYSTEM_PROMPT = `Du bist LifeOS, ein lokaler Lebensmanager. Antworte kurz, präzise, auf Deutsch. Nutze Tools wenn nötig. Bestätige Aktionen mit einem Satz. Keine Erklärungen unless gefragt. Priorisiere Offline-Operationen. Strukturiere Ausgaben als Listen.`;

// Static prefix for caching (never changes between requests)
export const STATIC_PREFIX = `Rolle: LifeOS-Assistent. Stil: Kurz, direkt, Deutsch. Regeln: 1) Tools für Daten. 2) Max 3 Sätze. 3) Bestätigung nach Aktion. 4) Bei Unsicherheit nachfragen.`;

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function getStaticPrefix(): string {
  return STATIC_PREFIX;
}

export function getChatHistory(): AIMessage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getChatSummary(): string {
  return localStorage.getItem(SUMMARY_KEY) || '';
}

export function addMessage(message: AIMessage): void {
  const history = getChatHistory();

  // Truncate content if too long
  if (message.content.length > MAX_MESSAGE_LENGTH) {
    message.content = message.content.substring(0, MAX_MESSAGE_LENGTH) + '…';
  }

  // Count tokens
  message.tokens = countTokens(message.content);

  history.push(message);

  // Keep only last MAX_HISTORY_MESSAGES
  if (history.length > MAX_HISTORY_MESSAGES) {
    // Summarize older messages before removing
    const removed = history.splice(0, history.length - MAX_HISTORY_MESSAGES);
    const summary = generateSummary(removed);
    const existingSummary = getChatSummary();
    const newSummary = existingSummary
      ? `${existingSummary} | ${summary}`
      : summary;

    // Keep summary compact (max 200 chars)
    localStorage.setItem(SUMMARY_KEY, newSummary.substring(0, 200));
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function generateSummary(messages: AIMessage[]): string {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  const parts: string[] = [];
  if (userMessages.length > 0) {
    parts.push(`${userMessages.length} Anfragen`);
  }
  if (assistantMessages.length > 0) {
    const topics = assistantMessages
      .map(m => m.content.split('.')[0])
      .slice(0, 2);
    parts.push(topics.join(', '));
  }

  return parts.join('; ');
}

export function buildContextWindow(
  userMessage: string,
  toolResults?: string
): { system: string; messages: AIMessage[]; totalTokens: number } {
  const system = getSystemPrompt();
  const history = getChatHistory();
  const summary = getChatSummary();

  let totalTokens = countTokens(system);

  // Add summary of older context if exists
  if (summary) {
    totalTokens += countTokens(summary);
  }

  // Add tool results if present (compact format)
  if (toolResults) {
    totalTokens += countTokens(toolResults);
  }

  // Count history tokens
  for (const msg of history) {
    totalTokens += msg.tokens || countTokens(msg.content);
  }

  totalTokens += countTokens(userMessage);

  return {
    system,
    messages: history,
    totalTokens,
  };
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SUMMARY_KEY);
}
