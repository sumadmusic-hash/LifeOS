import { ParsedIntent, AIMessage, TokenUsage, IntentCategory } from '../types';
import { parseIntent } from './intentParser';
import { countTokens, recordTokenUsage } from './tokenTracker';
import { getSystemPrompt, addMessage, getChatHistory, getChatSummary, buildContextWindow } from './contextManager';
import { getToolsForIntent, generateToolDefinitions, formatToolResultCompact } from './toolRouter';

// Simulated AI response generation
// In production, this would call the actual LLM API
async function simulateAIResponse(
  intent: ParsedIntent,
  context: ReturnType<typeof buildContextWindow>
): Promise<{ content: string; tokens: number; latency: number }> {
  const startTime = performance.now();

  // Simulate processing time (100-500ms)
  await new Promise(r => setTimeout(r, 100 + Math.random() * 400));

  let content = '';
  const systemTokens = countTokens(context.system);
  const historyTokens = context.messages.reduce((sum, m) => sum + (m.tokens || 0), 0);
  const totalPromptTokens = systemTokens + historyTokens;

  switch (intent.category) {
    case 'task':
      if (intent.action === 'create') {
        const title = intent.entities[0] || 'Neue Aufgabe';
        content = `✓ Aufgabe "${title}" erstellt.`;
      } else if (intent.action === 'read') {
        content = `Du hast 3 offene Aufgaben:\n1. E-Mail beantworten | offen\n2. Einkauf planen | in_progress\n3. Bericht fertigstellen | offen`;
      } else if (intent.action === 'update') {
        content = `✓ Aufgabe als erledigt markiert.`;
      } else if (intent.action === 'delete') {
        content = `✓ Aufgabe gelöscht.`;
      }
      break;
    case 'note':
      if (intent.action === 'create') {
        content = `✓ Notiz gespeichert.`;
      } else if (intent.action === 'search') {
        content = `2 Notizen gefunden:\n1. Meeting-Notizen | #arbeit\n2. Einkaufsliste | #privat`;
      }
      break;
    case 'habit':
      if (intent.action === 'create') {
        content = `✓ Habit angelegt. Streak beginnt heute.`;
      } else if (intent.action === 'update') {
        content = `✓ Habit für heute abgehakt. Streak: 5 Tage.`;
      } else if (intent.action === 'read') {
        content = `Deine Habits:\n1. Meditation | 🔥 12 Tage\n2. Sport | 🔥 5 Tage\n3. Lesen | 🔥 3 Tage`;
      }
      break;
    case 'finance':
      if (intent.action === 'create') {
        const amount = intent.entities.find(e => /\d/.test(e)) || '0';
        content = `✓ Ausgabe von ${amount}€ gebucht.`;
      } else if (intent.action === 'read') {
        content = `Budget-Status:\nEinnahmen: 2.800€\nAusgaben: 1.950€\nVerfügbar: 850€`;
      }
      break;
    case 'goal':
      if (intent.action === 'create') {
        content = `✓ Ziel erstellt. Viel Erfolg!`;
      } else if (intent.action === 'update') {
        content = `✓ Fortschritt aktualisiert.`;
      } else if (intent.action === 'read') {
        content = `Deine Ziele:\n1. 5km Laufen | 3.2/5 km\n2. Buch lesen | 180/320 Seiten\n3. Sparziel | 650/1000€`;
      }
      break;
    case 'summary':
      content = `📊 Heute:\n• 2 Aufgaben erledigt\n• 3 Habits abgehakt\n• 45€ ausgegeben\n• 1 Notiz erstellt`;
      break;
    case 'search':
      content = `Suchergebnisse:\n1. [Task] E-Mail beantworten\n2. [Note] Meeting-Notizen\n3. [Goal] 5km Laufen`;
      break;
    default:
      content = `Ich habe deine Anfrage verstanden. Wie kann ich helfen?`;
  }

  const completionTokens = countTokens(content);
  const latency = performance.now() - startTime;

  return {
    content,
    tokens: totalPromptTokens + completionTokens,
    latency,
  };
}

export interface PipelineResult {
  response: string;
  parserHit: boolean;
  tokensUsed: number;
  latency: number;
  intent: ParsedIntent;
  toolsSent: number;
}

export async function processUserInput(input: string): Promise<PipelineResult> {
  // Step 1: Local parser
  const intent = parseIntent(input);
  const parserHit = intent.confidence > 0;

  // Step 2: If parser hit → execute locally (0 AI tokens)
  if (parserHit && intent.confidence >= 0.8) {
    // Record as parser hit (minimal tokens for logging only)
    const logTokens = 5; // Just the log entry
    recordTokenUsage({
      model: 'local-parser',
      intent: intent.category,
      parserHit: true,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: logTokens,
      latency: 5,
    });

    // Add user message to history
    addMessage({ role: 'user', content: input, timestamp: Date.now() });

    // Generate local response
    const response = generateLocalResponse(intent);

    // Add assistant response to history
    addMessage({ role: 'assistant', content: response, timestamp: Date.now() });

    const toolsSent = getToolsForIntent(intent.category).length;

    return {
      response,
      parserHit: true,
      tokensUsed: logTokens,
      latency: 5,
      intent,
      toolsSent,
    };
  }

  // Step 3: Parser miss → route to AI with optimized context
  const context = buildContextWindow(input);
  const toolDefs = generateToolDefinitions(intent.category === 'unknown' ? 'search' : intent.category);

  const aiResult = await simulateAIResponse(intent, context);

  // Record AI usage
  recordTokenUsage({
    model: 'gpt-4o-mini',
    intent: intent.category,
    parserHit: false,
    promptTokens: context.totalTokens,
    completionTokens: countTokens(aiResult.content),
    totalTokens: aiResult.tokens,
    latency: aiResult.latency,
  });

  // Add to history
  addMessage({ role: 'user', content: input, timestamp: Date.now() });
  addMessage({ role: 'assistant', content: aiResult.content, timestamp: Date.now() });

  return {
    response: aiResult.content,
    parserHit: false,
    tokensUsed: aiResult.tokens,
    latency: aiResult.latency,
    intent,
    toolsSent: toolDefs.length,
  };
}

function generateLocalResponse(intent: ParsedIntent): string {
  switch (intent.category) {
    case 'task':
      if (intent.action === 'create') {
        const title = intent.entities[0] || 'Neue Aufgabe';
        return `✓ Aufgabe "${title}" erstellt.`;
      } else if (intent.action === 'read') {
        return `Du hast 3 offene Aufgaben:\n1. E-Mail beantworten | offen\n2. Einkauf planen | in_progress\n3. Bericht fertigstellen | offen`;
      } else if (intent.action === 'update') {
        return `✓ Aufgabe als erledigt markiert.`;
      } else if (intent.action === 'delete') {
        return `✓ Aufgabe gelöscht.`;
      }
      break;
    case 'note':
      if (intent.action === 'create') return `✓ Notiz gespeichert.`;
      if (intent.action === 'search') return `2 Notizen gefunden:\n1. Meeting-Notizen | #arbeit\n2. Einkaufsliste | #privat`;
      break;
    case 'habit':
      if (intent.action === 'create') return `✓ Habit angelegt. Streak beginnt heute.`;
      if (intent.action === 'update') return `✓ Habit für heute abgehakt. Streak: 5 Tage.`;
      if (intent.action === 'read') return `Deine Habits:\n1. Meditation | 🔥 12 Tage\n2. Sport | 🔥 5 Tage\n3. Lesen | 🔥 3 Tage`;
      break;
    case 'finance':
      if (intent.action === 'create') return `✓ Ausgabe gebucht.`;
      if (intent.action === 'read') return `Budget-Status:\nEinnahmen: 2.800€\nAusgaben: 1.950€\nVerfügbar: 850€`;
      break;
    case 'goal':
      if (intent.action === 'create') return `✓ Ziel erstellt.`;
      if (intent.action === 'update') return `✓ Fortschritt aktualisiert.`;
      if (intent.action === 'read') return `Deine Ziele:\n1. 5km Laufen | 3.2/5 km\n2. Buch lesen | 180/320 Seiten`;
      break;
    case 'summary':
      return `📊 Heute:\n• 2 Aufgaben erledigt\n• 3 Habits abgehakt\n• 45€ ausgegeben`;
    case 'search':
      return `Suchergebnisse:\n1. [Task] E-Mail beantworten\n2. [Note] Meeting-Notizen`;
    case 'settings':
      return `⚙️ Öffne Einstellungen…`;
    default:
      return `Verstanden. Wie kann ich helfen?`;
  }
  return `✓ Ausgeführt.`;
}
