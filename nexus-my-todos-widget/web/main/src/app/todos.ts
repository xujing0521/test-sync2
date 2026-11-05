export const maxTodos = 50;
export const maxTitle = 120;
export const displayLimits = [10, 20, 50] as const;

export type DisplayLimit = (typeof displayLimits)[number];

export function readDisplayLimit(value: unknown): DisplayLimit {
  return value === 10 || value === 20 || value === 50 ? value : 10;
}

export function readShowDone(value: unknown): boolean {
  return value !== false;
}

export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
}

export interface TodoListResult {
  saved: boolean;
  todos: TodoItem[];
}
