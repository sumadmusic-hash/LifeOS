import { EvalResult, IntentCategory } from '../types';
import { parseIntent } from './intentParser';
import { countTokens } from './tokenTracker';

export interface EvalSetEntry {
  id: number;
  query: string;
  expectedCategory: IntentCategory;
  expectedAction: string;
}

// 30 deutsche Nutzeranfragen als Eval-Set
export const EVAL_SET: EvalSetEntry[] = [
  { id: 1, query: 'Erstelle eine Aufgabe: E-Mails beantworten', expectedCategory: 'task', expectedAction: 'create' },
  { id: 2, query: 'Zeige meine offenen Aufgaben', expectedCategory: 'task', expectedAction: 'read' },
  { id: 3, query: 'Aufgabe erledigt markieren', expectedCategory: 'task', expectedAction: 'update' },
  { id: 4, query: 'Lösche die Aufgabe Einkaufen', expectedCategory: 'task', expectedAction: 'delete' },
  { id: 5, query: 'Nicht vergessen: Zahnarzttermin morgen', expectedCategory: 'task', expectedAction: 'create' },
  { id: 6, query: 'Schreib eine Notiz: Meeting um 15 Uhr', expectedCategory: 'note', expectedAction: 'create' },
  { id: 7, query: 'Finde Notizen zum Thema Projekt', expectedCategory: 'note', expectedAction: 'search' },
  { id: 8, query: 'Neue Gewohnheit: Jeden Tag meditieren', expectedCategory: 'habit', expectedAction: 'create' },
  { id: 9, query: 'Habit Meditation abgehakt', expectedCategory: 'habit', expectedAction: 'update' },
  { id: 10, query: 'Zeige meine Habits und Streaks', expectedCategory: 'habit', expectedAction: 'read' },
  { id: 11, query: 'Ausgabe eintragen: 45€ Supermarkt', expectedCategory: 'finance', expectedAction: 'create' },
  { id: 12, query: 'Wie ist mein Budget diesen Monat?', expectedCategory: 'finance', expectedAction: 'read' },
  { id: 13, query: 'Einnahme: Gehalt 2800€', expectedCategory: 'finance', expectedAction: 'create' },
  { id: 14, query: 'Neues Ziel: 5km laufen bis Ende Monat', expectedCategory: 'goal', expectedAction: 'create' },
  { id: 15, query: 'Ziel Fortschritt: 3km geschafft', expectedCategory: 'goal', expectedAction: 'update' },
  { id: 16, query: 'Zeige meine Ziele', expectedCategory: 'goal', expectedAction: 'read' },
  { id: 17, query: 'Tageszusammenfassung', expectedCategory: 'summary', expectedAction: 'summarize' },
  { id: 18, query: 'Was habe ich heute erreicht?', expectedCategory: 'summary', expectedAction: 'summarize' },
  { id: 19, query: 'Wochenbericht bitte', expectedCategory: 'summary', expectedAction: 'summarize' },
  { id: 20, query: 'Suche nach Einkaufsliste', expectedCategory: 'search', expectedAction: 'search' },
  { id: 21, query: 'Wo ist meine Notiz über Rezepte?', expectedCategory: 'search', expectedAction: 'search' },
  { id: 22, query: 'Aufgabe erstellen mit hoher Priorität', expectedCategory: 'task', expectedAction: 'create' },
  { id: 23, query: 'Todo neu: Steuererklärung', expectedCategory: 'task', expectedAction: 'create' },
  { id: 24, query: 'Gewohnheit starten: 2 Liter Wasser trinken', expectedCategory: 'habit', expectedAction: 'create' },
  { id: 25, query: 'Notiz anlegen: Ideen für Geburtstag', expectedCategory: 'note', expectedAction: 'create' },
  { id: 26, query: 'Meine Finanzen Übersicht', expectedCategory: 'finance', expectedAction: 'read' },
  { id: 27, query: 'Einstellungen öffnen', expectedCategory: 'settings', expectedAction: 'read' },
  { id: 28, query: 'KI-Effizienz anzeigen', expectedCategory: 'settings', expectedAction: 'read' },
  { id: 29, query: 'Merke dir: Omas Rezept für Kuchen', expectedCategory: 'note', expectedAction: 'create' },
  { id: 30, query: 'Status meiner Aufgaben bitte', expectedCategory: 'task', expectedAction: 'read' },
];

export function runEvalSet(): EvalResult[] {
  const results: EvalResult[] = [];

  for (const entry of EVAL_SET) {
    const parsed = parseIntent(entry.query);
    const parserHit = parsed.confidence > 0;

    // Quality score: 1.0 if both category and action match
    const categoryMatch = parsed.category === entry.expectedCategory;
    const actionMatch = parsed.action === entry.expectedAction;
    const qualityScore = categoryMatch && actionMatch ? 1.0
      : categoryMatch || actionMatch ? 0.5
      : 0.0;

    results.push({
      query: entry.query,
      expectedIntent: entry.expectedCategory,
      expectedAction: entry.expectedAction,
      parsedIntent: parsed,
      parserHit,
      tokensUsed: parserHit ? 5 : 350, // Parser hit = 5 tokens, miss = ~350 tokens
      qualityScore,
    });
  }

  return results;
}

export function getEvalSummary(): {
  total: number;
  parserHits: number;
  hitRate: number;
  avgQuality: number;
  qualityAboveThreshold: boolean;
  totalTokens: number;
  baselineTokens: number;
  reductionPercent: number;
} {
  const results = runEvalSet();
  const total = results.length;
  const parserHits = results.filter(r => r.parserHit).length;
  const avgQuality = results.reduce((sum, r) => sum + r.qualityScore, 0) / total;
  const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0);
  const baselineTokens = total * 800; // Baseline: all go to AI

  return {
    total,
    parserHits,
    hitRate: (parserHits / total) * 100,
    avgQuality,
    qualityAboveThreshold: avgQuality >= 0.95, // ≤5% below baseline
    totalTokens,
    baselineTokens,
    reductionPercent: ((baselineTokens - totalTokens) / baselineTokens) * 100,
  };
}
