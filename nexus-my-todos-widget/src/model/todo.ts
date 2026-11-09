export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
}

export interface TodoEntity {
  id: string;
  widget_id: string;
  items: TodoItem[];
}

export interface TodoListResult {
  saved: boolean;
  todos: TodoItem[];
}

export interface SaveTodosPayload {
  todos?: unknown;
}

const maxTodos = 50;
const maxTitle = 120;

export function parseTodoList(value: unknown): TodoItem[] {
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
    return [
      {
        id: row["id"].slice(0, 64),
        title: row["title"].trim().slice(0, maxTitle),
        done: row["done"] === true,
      },
    ];
  });
}

export function parseSaveTodosPayload(payload: SaveTodosPayload | undefined): TodoItem[] {
  return parseTodoList(payload?.todos).slice(0, maxTodos);
}
