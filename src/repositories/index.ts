import { Task, Note, Habit, FinanceEntry, Goal } from '../types';
import { pushUndo } from '../core/undoStack';

// Repository Pattern - no direct DB access
// All data operations go through repositories

function getStore<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStore<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Task Repository
export const TaskRepo = {
  getAll: (): Task[] => getStore<Task>('lifeos_tasks'),
  getById: (id: string): Task | undefined => getStore<Task>('lifeos_tasks').find(t => t.id === id),
  create: (task: Omit<Task, 'id' | 'createdAt'>): Task => {
    const tasks = getStore<Task>('lifeos_tasks');
    const newTask: Task = { ...task, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    tasks.push(newTask);
    setStore('lifeos_tasks', tasks);
    pushUndo({ action: 'create_task', data: newTask, entityType: 'task' });
    return newTask;
  },
  update: (id: string, updates: Partial<Task>): Task | null => {
    const tasks = getStore<Task>('lifeos_tasks');
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const old = { ...tasks[idx] };
    tasks[idx] = { ...tasks[idx], ...updates };
    setStore('lifeos_tasks', tasks);
    pushUndo({ action: 'update_task', data: old, entityType: 'task' });
    return tasks[idx];
  },
  delete: (id: string): boolean => {
    const tasks = getStore<Task>('lifeos_tasks');
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    pushUndo({ action: 'delete_task', data: tasks[idx], entityType: 'task' });
    tasks.splice(idx, 1);
    setStore('lifeos_tasks', tasks);
    return true;
  },
};

// Note Repository
export const NoteRepo = {
  getAll: (): Note[] => getStore<Note>('lifeos_notes'),
  create: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const notes = getStore<Note>('lifeos_notes');
    const now = new Date().toISOString();
    const newNote: Note = { ...note, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    notes.push(newNote);
    setStore('lifeos_notes', notes);
    pushUndo({ action: 'create_note', data: newNote, entityType: 'note' });
    return newNote;
  },
  search: (query: string): Note[] => {
    const notes = getStore<Note>('lifeos_notes');
    const q = query.toLowerCase();
    return notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q)));
  },
};

// Habit Repository
export const HabitRepo = {
  getAll: (): Habit[] => getStore<Habit>('lifeos_habits'),
  create: (habit: Omit<Habit, 'id' | 'streak'>): Habit => {
    const habits = getStore<Habit>('lifeos_habits');
    const newHabit: Habit = { ...habit, id: crypto.randomUUID(), streak: 0 };
    habits.push(newHabit);
    setStore('lifeos_habits', habits);
    pushUndo({ action: 'create_habit', data: newHabit, entityType: 'habit' });
    return newHabit;
  },
  complete: (id: string): Habit | null => {
    const habits = getStore<Habit>('lifeos_habits');
    const idx = habits.findIndex(h => h.id === id);
    if (idx === -1) return null;
    habits[idx].streak += 1;
    habits[idx].lastCompleted = new Date().toISOString();
    setStore('lifeos_habits', habits);
    return habits[idx];
  },
};

// Finance Repository
export const FinanceRepo = {
  getAll: (): FinanceEntry[] => getStore<FinanceEntry>('lifeos_finance'),
  create: (entry: Omit<FinanceEntry, 'id'>): FinanceEntry => {
    const entries = getStore<FinanceEntry>('lifeos_finance');
    const newEntry: FinanceEntry = { ...entry, id: crypto.randomUUID() };
    entries.push(newEntry);
    setStore('lifeos_finance', entries);
    pushUndo({ action: 'create_finance', data: newEntry, entityType: 'finance' });
    return newEntry;
  },
  getBalance: (): { income: number; expenses: number; balance: number } => {
    const entries = getStore<FinanceEntry>('lifeos_finance');
    const income = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expenses = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return { income, expenses, balance: income - expenses };
  },
};

// Goal Repository
export const GoalRepo = {
  getAll: (): Goal[] => getStore<Goal>('lifeos_goals'),
  create: (goal: Omit<Goal, 'id' | 'progress'>): Goal => {
    const goals = getStore<Goal>('lifeos_goals');
    const newGoal: Goal = { ...goal, id: crypto.randomUUID(), progress: 0 };
    goals.push(newGoal);
    setStore('lifeos_goals', goals);
    pushUndo({ action: 'create_goal', data: newGoal, entityType: 'goal' });
    return newGoal;
  },
  updateProgress: (id: string, progress: number): Goal | null => {
    const goals = getStore<Goal>('lifeos_goals');
    const idx = goals.findIndex(g => g.id === id);
    if (idx === -1) return null;
    goals[idx].progress = progress;
    setStore('lifeos_goals', goals);
    return goals[idx];
  },
};
