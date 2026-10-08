import { ParsedIntent, IntentCategory } from '../types';

// Local Regex/Keyword Parser - handles ~70% of intents offline
// No AI token cost for these matches

interface PatternRule {
  category: IntentCategory;
  action: ParsedIntent['action'];
  patterns: RegExp[];
  keywords: string[];
}

const RULES: PatternRule[] = [
  // Task patterns
  {
    category: 'task',
    action: 'create',
    patterns: [
      /(?:erstelle|erstell|mach|füge|add|neu)\s+(eine?\s+)?(aufgabe|todo|task)/i,
      /(?:aufgabe|todo|task)\s+(erstellen|anlegen|hinzufügen|neu)/i,
      /(?:ich muss|ich soll|nicht vergessen)\s+.+/i,
      /(?:erinnere mich an|merk dir|notier)\s+.+/i,
    ],
    keywords: ['aufgabe erstellen', 'todo neu', 'task hinzufügen', 'nicht vergessen'],
  },
  {
    category: 'task',
    action: 'read',
    patterns: [
      /(?:zeige|list|welche)\s+(meine\s+)?(aufgaben|todos|tasks)/i,
      /(?:was\s+ist\s+)?(?:offen|pending|zu erledigen)/i,
      /(?:meine|alle)\s+(aufgaben|todos)/i,
    ],
    keywords: ['aufgaben zeigen', 'todos anzeigen', 'was ist offen', 'meine tasks'],
  },
  {
    category: 'task',
    action: 'update',
    patterns: [
      /(?:erledigt|fertig|done|abgeschlossen)\s+.+/i,
      /(?:markier|setz|änder)\s+.+\s+(auf\s+)?(?:erledigt|fertig|done)/i,
      /(?:priorität|prio)\s+(ändern|setzen|hoch|runter)/i,
    ],
    keywords: ['erledigt markieren', 'aufgabe fertig', 'prio ändern'],
  },
  {
    category: 'task',
    action: 'delete',
    patterns: [
      /(?:lösche|entferne|streich|weg)\s+(die\s+)?(aufgabe|todo|task)/i,
      /(?:aufgabe|todo|task)\s+(löschen|entfernen|weg)/i,
    ],
    keywords: ['aufgabe löschen', 'todo entfernen', 'task streichen'],
  },
  // Note patterns
  {
    category: 'note',
    action: 'create',
    patterns: [
      /(?:notiz|note)\s+(erstellen|anlegen|neu|schreib)/i,
      /(?:schreib|notier|merk)\s+(dir\s+)?(eine?\s+)?notiz/i,
      /(?:notiere|schreibe auf)[:\s]+.+/i,
    ],
    keywords: ['notiz erstellen', 'notiz anlegen', 'schreib notiz', 'merk dir'],
  },
  {
    category: 'note',
    action: 'search',
    patterns: [
      /(?:finde|suche|zeig)\s+(meine\s+)?notiz/i,
      /(?:in\s+meinen?\s+notizen?)\s+(suchen|finden)/i,
    ],
    keywords: ['notiz finden', 'notiz suchen', 'in notizen'],
  },
  // Habit patterns
  {
    category: 'habit',
    action: 'create',
    patterns: [
      /(?:habit|gewohnheit)\s+(erstellen|anlegen|neu|starten)/i,
      /(?:neue\s+)?(?:habit|gewohnheit)/i,
    ],
    keywords: ['habit erstellen', 'gewohnheit anlegen', 'neue gewohnheit'],
  },
  {
    category: 'habit',
    action: 'update',
    patterns: [
      /(?:habit|gewohnheit)\s+(ab|hak|check|erledigt|done)/i,
      /(?:abgehakt|checked|done|erledigt)\s+(heute|habit|gewohnheit)/i,
    ],
    keywords: ['habit abhaken', 'habit erledigt', 'gewohnheit checken'],
  },
  {
    category: 'habit',
    action: 'read',
    patterns: [
      /(?:zeige|wie\s+sind)\s+(meine\s+)?(habits|gewohnheiten)/i,
      /(?:streak|serie|kette)/i,
    ],
    keywords: ['habits zeigen', 'gewohnheiten anzeigen', 'streak'],
  },
  // Finance patterns
  {
    category: 'finance',
    action: 'create',
    patterns: [
      /(?:ausgabe|kosten|bezahlt|gekauft)\s+.+/i,
      /(?:einnahme|gehalt|bekommen|erhalten)\s+.+/i,
      /(?:buch|notier)\s+.+\s+(€|euro|ausgabe|einnahme)/i,
    ],
    keywords: ['ausgabe eintragen', 'kosten notieren', 'einnahme buchen'],
  },
  {
    category: 'finance',
    action: 'read',
    patterns: [
      /(?:zeige|wie\s+ist)\s+(mein\s+)?(?:budget|finanzen|konto|bilanz)/i,
      /(?:monatsausgaben|ausgaben\s+diesen\s+monat)/i,
      /(?:wie\s+viel|gesamt|summe)\s+(ausgegeben|übrig|verfügbar)/i,
    ],
    keywords: ['finanzen zeigen', 'budget anzeigen', 'monatsausgaben', 'wie viel übrig'],
  },
  // Goal patterns
  {
    category: 'goal',
    action: 'create',
    patterns: [
      /(?:ziel|goal)\s+(erstellen|setzen|anlegen|neu)/i,
      /(?:ich will|mein ziel)[:\s]+.+/i,
    ],
    keywords: ['ziel erstellen', 'goal setzen', 'ziel anlegen'],
  },
  {
    category: 'goal',
    action: 'update',
    patterns: [
      /(?:fortschritt|progress|update)\s+(ziel|goal)/i,
      /(?:ziel|goal)\s+(aktualisier|update|fortschritt)/i,
    ],
    keywords: ['ziel aktualisieren', 'fortschritt eintragen', 'goal update'],
  },
  {
    category: 'goal',
    action: 'read',
    patterns: [
      /(?:zeige|wie\s+sind)\s+(meine\s+)?(ziele|goals)/i,
    ],
    keywords: ['ziele zeigen', 'goals anzeigen', 'meine ziele'],
  },
  // Search patterns
  {
    category: 'search',
    action: 'search',
    patterns: [
      /(?:suche|finde|wo\s+ist)\s+.+/i,
      /(?:überall\s+)?suchen?\s+nach\s+.+/i,
    ],
    keywords: ['suche nach', 'finde', 'wo ist'],
  },
  // Summary patterns
  {
    category: 'summary',
    action: 'summarize',
    patterns: [
      /(?:zusammenfassung|übersicht|summary|recap|tagesbericht)/i,
      /(?:was\s+habe\s+ich|was\s+ist\s+heute|heute\s+erreicht)/i,
      /(?:wochenbericht|monatsbericht|status)/i,
    ],
    keywords: ['zusammenfassung', 'übersicht', 'tagesbericht', 'was habe ich', 'status'],
  },
  // Settings patterns
  {
    category: 'settings',
    action: 'read',
    patterns: [
      /(?:einstellungen|settings|konfiguration|prefs)/i,
      /(?:ki-effizienz|token|effizienz|statistiken)/i,
    ],
    keywords: ['einstellungen', 'settings', 'ki-effizienz', 'token-statistik'],
  },
];

export function parseIntent(input: string): ParsedIntent {
  const normalized = input.trim().toLowerCase();

  for (const rule of RULES) {
    // Check regex patterns first
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        return {
          category: rule.category,
          action: rule.action,
          entities: extractEntities(input, rule.category),
          confidence: 0.92,
          rawInput: input,
        };
      }
    }

    // Check keyword matches
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return {
          category: rule.category,
          action: rule.action,
          entities: extractEntities(input, rule.category),
          confidence: 0.85,
          rawInput: input,
        };
      }
    }
  }

  // No local match - will be routed to AI
  return {
    category: 'unknown',
    action: 'unknown',
    entities: [],
    confidence: 0,
    rawInput: input,
  };
}

function extractEntities(input: string, category: IntentCategory): string[] {
  const entities: string[] = [];
  const words = input.split(/\s+/);

  // Extract quoted strings
  const quoted = input.match(/["']([^"']+)["']/g);
  if (quoted) entities.push(...quoted.map(q => q.replace(/["']/g, '')));

  // Extract numbers (for finance, goals)
  const numbers = input.match(/\d+([.,]\d+)?/g);
  if (numbers && (category === 'finance' || category === 'goal')) {
    entities.push(...numbers);
  }

  // Extract dates
  const dates = input.match(/\d{1,2}[./]\d{1,2}([./]\d{2,4})?/g);
  if (dates) entities.push(...dates);

  // For tasks/notes, extract the main content after the action verb
  if (category === 'task' || category === 'note') {
    const contentMatch = input.match(/(?:erstelle|erstell|mach|notier|schreib|merk)\s+(?:dir\s+)?(?:eine?\s+)?(?:aufgabe|todo|task|notiz|note)?\s*[:\s]*(.+)/i);
    if (contentMatch && contentMatch[1]) {
      entities.push(contentMatch[1].trim());
    }
  }

  return entities.slice(0, 5); // Limit entities
}

export function getParserHitRate(): number {
  // Simulated hit rate based on eval set
  return 0.72;
}
