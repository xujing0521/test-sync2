import type { NexusAppContext } from "@pc-nexus/core";
import { type TodoItem, type TodoListResult, parseTodoList } from "../model/index.js";
import { todoStorage } from "../storage.js";

const maxTodos = 50;

function widgetId(context: NexusAppContext): string | null {
  const data = context.extension?.data;
  const widget = data?.["widget"];
  if (widget !== null && typeof widget === "object" && "id" in widget && typeof widget.id === "string" && widget.id) {
    return widget.id;
  }
  return null;
}

export class TodoService {
  async list(context: NexusAppContext): Promise<TodoListResult> {
    const id = widgetId(context);
    if (!id) {
      return { saved: false, todos: [] };
    }
    const rows = await todoStorage.find((condition) => condition.field("widget_id").eq(id), { limit: 1 });
    const stored = rows.find((row) => row.id === id);
    if (!stored || !Array.isArray(stored.items)) {
      return { saved: false, todos: [] };
    }
    return { saved: true, todos: parseTodoList(stored.items) };
  }

  async save(context: NexusAppContext, next: TodoItem[]): Promise<TodoItem[]> {
    const id = widgetId(context);
    if (!id) {
      throw new Error("Missing widget id");
    }
    const items = next.slice(0, maxTodos);
    const rows = await todoStorage.find((condition) => condition.field("id").eq(id), { limit: 1 });
    if (rows.length === 0) {
      await todoStorage.insert({ id, widget_id: id, items });
    } else {
      await todoStorage.update((condition) => condition.field("id").eq(id), { items });
    }
    return items;
  }
}

export const todoService = new TodoService();
