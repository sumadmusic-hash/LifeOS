import { ToolDefinition, IntentCategory } from '../types';

// All available tools grouped by category
const ALL_TOOLS: ToolDefinition[] = [
  // Task tools
  { name: 'create_task', category: 'task', description: 'Aufgabe erstellen', parameters: { title: 'string', priority: 'string', dueDate: 'string' } },
  { name: 'list_tasks', category: 'task', description: 'Aufgaben auflisten', parameters: { status: 'string', limit: 'number' } },
  { name: 'update_task', category: 'task', description: 'Aufgabe aktualisieren', parameters: { id: 'string', status: 'string', priority: 'string' } },
  { name: 'delete_task', category: 'task', description: 'Aufgabe löschen', parameters: { id: 'string' } },

  // Note tools
  { name: 'create_note', category: 'note', description: 'Notiz erstellen', parameters: { title: 'string', content: 'string', tags: 'string[]' } },
  { name: 'search_notes', category: 'note', description: 'Notizen durchsuchen', parameters: { query: 'string', limit: 'number' } },
  { name: 'list_notes', category: 'note', description: 'Notizen auflisten', parameters: { tag: 'string', limit: 'number' } },

  // Habit tools
  { name: 'create_habit', category: 'habit', description: 'Habit anlegen', parameters: { name: 'string', frequency: 'string' } },
  { name: 'complete_habit', category: 'habit', description: 'Habit abhaken', parameters: { id: 'string' } },
  { name: 'list_habits', category: 'habit', description: 'Habits anzeigen', parameters: { limit: 'number' } },

  // Finance tools
  { name: 'add_transaction', category: 'finance', description: 'Transaktion buchen', parameters: { description: 'string', amount: 'number', type: 'string' } },
  { name: 'get_balance', category: 'finance', description: 'Kontostand/Budget', parameters: { period: 'string' } },
  { name: 'list_transactions', category: 'finance', description: 'Transaktionen auflisten', parameters: { type: 'string', limit: 'number' } },

  // Goal tools
  { name: 'create_goal', category: 'goal', description: 'Ziel erstellen', parameters: { title: 'string', target: 'number', unit: 'string' } },
  { name: 'update_goal', category: 'goal', description: 'Ziel-Fortschritt', parameters: { id: 'string', progress: 'number' } },
  { name: 'list_goals', category: 'goal', description: 'Ziele anzeigen', parameters: { limit: 'number' } },

  // Search tools
  { name: 'global_search', category: 'search', description: 'Globale Suche', parameters: { query: 'string', limit: 'number' } },

  // Summary tools
  { name: 'daily_summary', category: 'summary', description: 'Tageszusammenfassung', parameters: { date: 'string' } },
  { name: 'weekly_summary', category: 'summary', description: 'Wochenbericht', parameters: { week: 'number' } },
];

// Category mapping for dynamic routing
const CATEGORY_MAP: Record<IntentCategory, string[]> = {
  task: ['create_task', 'list_tasks', 'update_task', 'delete_task'],
  note: ['create_note', 'search_notes', 'list_notes'],
  habit: ['create_habit', 'complete_habit', 'list_habits'],
  finance: ['add_transaction', 'get_balance', 'list_transactions'],
  goal: ['create_goal', 'update_goal', 'list_goals'],
  search: ['global_search'],
  summary: ['daily_summary', 'weekly_summary'],
  settings: [],
  unknown: ['global_search'], // Fallback
};

export function getToolsForIntent(category: IntentCategory): ToolDefinition[] {
  const toolNames = CATEGORY_MAP[category] || CATEGORY_MAP.unknown;
  return ALL_TOOLS.filter(t => toolNames.includes(t.name));
}

export function getToolByName(name: string): ToolDefinition | undefined {
  return ALL_TOOLS.find(t => t.name === name);
}

// Generate compact function definitions for API call
export function generateToolDefinitions(category: IntentCategory): object[] {
  const tools = getToolsForIntent(category);
  return tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(t.parameters).map(([k, v]) => [k, { type: v }])
        ),
        required: Object.keys(t.parameters).slice(0, 1),
      },
    },
  }));
}

// Format tool results compactly (ID + Titel + Status, max 10)
export function formatToolResultCompact(items: Array<{ id: string; title: string; status?: string }>): string {
  const limited = items.slice(0, 10);
  return limited.map(i => `${i.id}|${i.title}|${i.status || 'ok'}`).join('\n');
}

export function getAllTools(): ToolDefinition[] {
  return ALL_TOOLS;
}

export function getToolCount(): number {
  return ALL_TOOLS.length;
}
