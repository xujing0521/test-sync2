export const maxTodos = 50;
export const maxTitle = 120;
export const displayLimits = [10, 20, 50] as const;

export type DisplayLimit = (typeof displayLimits)[number];

export function readDisplayLimit(value: unknown): DisplayLimit {
  const n = typeof value === "string" ? Number(value) : value;
  return n === 10 || n === 20 || n === 50 ? n : 10;
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

export function copyTodos(list: TodoItem[]): TodoItem[] {
  return list.map((todo) => ({ ...todo }));
}

export function readTodos(value: unknown): TodoItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (item === null || typeof item !== "object") {
      return [];
    }
    const row = item as Record<string, unknown>;
    if (typeof row["id"] !== "string" || typeof row["title"] !== "string" || !row["title"].trim()) {
      return [];
    }
    return [{ id: row["id"], title: row["title"], done: row["done"] === true }];
  });
}

export function sameTodos(left: TodoItem[], right: TodoItem[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every(
    (todo, index) =>
      todo.id === right[index].id && todo.title === right[index].title && todo.done === right[index].done,
  );
}
