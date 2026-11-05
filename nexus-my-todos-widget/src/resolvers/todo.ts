import type { Resolver } from "@pc-nexus/core";
import { type SaveTodosPayload, type TodoItem, type TodoListResult, parseSaveTodosPayload } from "../model/index.js";
import { todoService } from "../services/todo.js";

export function defineTodoFns(resolver: Resolver) {
  resolver.define<void, TodoListResult>("get-all", async (context) => {
    return todoService.list(context);
  });

  resolver.define<SaveTodosPayload, TodoItem[]>("save", async (context, payload) => {
    return todoService.save(context, parseSaveTodosPayload(payload));
  });
}
