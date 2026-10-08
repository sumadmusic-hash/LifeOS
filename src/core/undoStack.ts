import { UndoEntry } from '../types';

const STORAGE_KEY = 'lifeos_undo_stack';
const MAX_UNDO_ENTRIES = 50;

export function getUndoStack(): UndoEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function pushUndo(entry: Omit<UndoEntry, 'id' | 'timestamp'>): void {
  const stack = getUndoStack();
  stack.push({
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });

  // Limit stack size
  if (stack.length > MAX_UNDO_ENTRIES) {
    stack.splice(0, stack.length - MAX_UNDO_ENTRIES);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
}

export function popUndo(): UndoEntry | null {
  const stack = getUndoStack();
  if (stack.length === 0) return null;

  const entry = stack.pop()!;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  return entry;
}

export function clearUndoStack(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function canUndo(): boolean {
  return getUndoStack().length > 0;
}
