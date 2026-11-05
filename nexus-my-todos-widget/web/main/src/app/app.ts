import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { invoke, view } from "@pc-nexus/bridge";
import { ThyButton, ThyButtonIcon } from "ngx-tethys/button";
import { ThyCheckbox } from "ngx-tethys/checkbox";
import { ThyFlexibleText } from "ngx-tethys/flexible-text";
import { ThyIcon } from "ngx-tethys/icon";
import { ThyInputDirective } from "ngx-tethys/input";
import { ThyLoading } from "ngx-tethys/loading";
import { ThySelect } from "ngx-tethys/select";
import { ThyOption } from "ngx-tethys/shared";
import { ThySwitch } from "ngx-tethys/switch";
import { ThyTooltipDirective } from "ngx-tethys/tooltip";
import {
  displayLimits,
  maxTitle as titleLimit,
  maxTodos as todoLimit,
  readDisplayLimit,
  readShowDone,
  type DisplayLimit,
  type TodoItem,
  type TodoListResult,
} from "./todos";

function copyTodos(list: TodoItem[]): TodoItem[] {
  return list.map((todo) => ({ ...todo }));
}

function readTodos(value: unknown): TodoItem[] {
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

function sameTodos(left: TodoItem[], right: TodoItem[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every(
    (todo, index) =>
      todo.id === right[index].id && todo.title === right[index].title && todo.done === right[index].done,
  );
}

@Component({
  selector: "app-root",
  imports: [
    FormsModule,
    ThyButton,
    ThyButtonIcon,
    ThyCheckbox,
    ThyFlexibleText,
    ThyIcon,
    ThyInputDirective,
    ThyLoading,
    ThyOption,
    ThySelect,
    ThySwitch,
    ThyTooltipDirective,
  ],
  templateUrl: "./app.html",
  styleUrls: ["./app.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly loading = signal(true);
  protected readonly todos = signal<TodoItem[]>([]);
  protected readonly editing = signal(false);
  private readonly saved = signal<TodoItem[]>([]);
  protected readonly draftText = signal("");
  protected readonly composing = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly maxTitle = titleLimit;
  protected readonly maxTodos = todoLimit;
  protected readonly displayLimits = displayLimits;
  protected readonly limit = signal<DisplayLimit>(10);
  protected readonly showDone = signal(true);
  protected readonly visibleTodos = computed(() => {
    const source = this.showDone() ? this.todos() : this.todos().filter((todo) => !todo.done);
    return source.slice(-this.limit());
  });
  private readonly injector = inject(Injector);
  private readonly draftInput = viewChild("draftInput", { read: ElementRef<HTMLInputElement> });
  private widgetId: string | null = null;

  constructor() {
    void this.load();
  }

  protected startAdd() {
    if (this.saving() || this.todos().length >= this.maxTodos) {
      return;
    }
    this.composing.set(true);
    afterNextRender(() => this.draftInput()?.nativeElement.focus(), { injector: this.injector });
  }

  protected cancelAdd() {
    if (this.saving()) {
      return;
    }
    this.draftText.set("");
    this.composing.set(false);
  }

  protected addTodo() {
    const title = this.draftText().trim();
    if (!title || title.length > this.maxTitle || this.todos().length >= this.maxTodos || this.saving()) {
      return;
    }
    this.draftText.set("");
    this.composing.set(false);
    const next = [...this.todos(), { id: crypto.randomUUID(), title, done: false }];
    this.todos.set(next);
    if (!this.editing()) {
      void this.persist(next);
    }
  }

  protected toggleTodo(id: string, done: boolean) {
    if (this.saving()) {
      return;
    }
    const next = this.todos().map((todo) => (todo.id === id && todo.done !== done ? { ...todo, done } : todo));
    if (sameTodos(next, this.todos())) {
      return;
    }
    this.todos.set(next);
    if (!this.editing()) {
      void this.persist(next);
    }
  }

  protected removeTodo(id: string) {
    if (this.saving()) {
      return;
    }
    const next = this.todos().filter((todo) => todo.id !== id);
    this.todos.set(next);
    if (!this.editing()) {
      void this.persist(next);
    }
  }

  protected setLimit(value: unknown) {
    this.limit.set(readDisplayLimit(value));
  }

  protected onLimitPanel(open: boolean) {
    if (open) {
      this.fitLimitPanel(0);
    }
  }

  private fitLimitPanel(attempt: number) {
    const pane = document.querySelector(".cdk-overlay-pane");
    const options = pane?.querySelector(".thy-select-dropdown-options");
    if (!(pane instanceof HTMLElement) || !(options instanceof HTMLElement)) {
      if (attempt < 5) {
        setTimeout(() => this.fitLimitPanel(attempt + 1), 16);
      }
      return;
    }
    const room = Math.floor(window.innerHeight - pane.getBoundingClientRect().top - 8);
    options.style.maxHeight = `${Math.max(room, 40)}px`;
  }

  protected async confirm() {
    if (this.saving() || !this.editing()) {
      return;
    }
    const submitted = await this.run(() =>
      view.submit({
        config: {
          limit: this.limit(),
          show_done: this.showDone(),
        },
      }),
    );
    if (submitted !== true && !this.error()) {
      this.fail(new Error("没能保存"));
    }
  }

  private async persist(next: TodoItem[]) {
    const previous = copyTodos(this.saved());
    if (!this.widgetId) {
      this.todos.set(previous);
      this.fail(new Error("没能保存"));
      return;
    }
    const saved = await this.run(() => invoke<{ todos: TodoItem[] }, TodoItem[]>("save", { todos: next }));
    if (!saved) {
      this.todos.set(previous);
      return;
    }
    this.saved.set(copyTodos(saved));
    this.todos.set(copyTodos(saved));
  }

  private remember(list: TodoItem[]) {
    const next = copyTodos(list);
    this.saved.set(copyTodos(next));
    this.todos.set(next);
  }

  private async load() {
    this.loading.set(true);
    try {
      const context = await view.getContext<{
        entry?: { mode?: "view" | "edit" };
        config?: { limit?: unknown; show_done?: unknown };
        widget?: { id?: unknown };
      }>();
      const data = context.extension?.data;
      const widgetId = data?.widget?.id;
      this.widgetId = typeof widgetId === "string" && widgetId ? widgetId : null;
      const editing = data?.entry?.mode === "edit";
      this.editing.set(editing);
      this.limit.set(readDisplayLimit(data?.config?.limit));
      this.showDone.set(readShowDone(data?.config?.show_done));
      const stored = await invoke<void, TodoListResult>("get-all");
      this.remember(stored.saved ? readTodos(stored.todos) : []);
    } catch (err) {
      this.fail(err);
    } finally {
      this.loading.set(false);
    }
  }

  private async run<T>(action: () => Promise<T>): Promise<T | undefined> {
    this.saving.set(true);
    this.error.set(null);
    try {
      return await action();
    } catch (err) {
      this.fail(err);
      return undefined;
    } finally {
      this.saving.set(false);
    }
  }

  private fail(err: unknown) {
    this.error.set(err instanceof Error ? err.message : "没能保存");
  }
}
