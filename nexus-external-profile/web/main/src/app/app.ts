import { Component, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { invoke, router } from "@pc-nexus/bridge";
import { ThyButton } from "ngx-tethys/button";
import { ThyInputDirective } from "ngx-tethys/input";

interface GithubProfile {
  login: string;
  name: string;
  avatarUrl: string;
  bio: string;
  company: string;
  location: string;
  profileUrl: string;
  publicRepos: number;
}

type GithubLookup =
  | { status: "ready"; username: string; profile: GithubProfile; bound: boolean }
  | { status: "not_found"; username: string }
  | { status: "rate_limited"; username: string };

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | GithubLookup;

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "无法绑定 GitHub 用户";
}

@Component({
  selector: "app-root",
  imports: [FormsModule, ThyButton, ThyInputDirective],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App {
  protected readonly draft = signal("");
  protected readonly displayUsername = signal("");
  protected readonly bound = signal(false);
  protected readonly profile = signal<GithubProfile | null>(null);
  protected readonly state = signal<LoadState>({ status: "loading" });

  protected readonly loading = computed(() => this.state().status === "loading");
  protected readonly actionLabel = computed(() => (this.bound() ? "重新绑定" : "绑定"));
  protected readonly fieldLabel = "绑定 github 账号";
  protected readonly statusMessage = computed(() => {
    const current = this.state();
    if (current.status === "loading") {
      return { kind: "info" as const, text: "正在处理…" };
    }
    if (current.status === "error") {
      return { kind: "error" as const, text: current.message };
    }
    if (current.status === "not_found") {
      return { kind: "error" as const, text: "找不到这个 GitHub 用户。" };
    }
    if (current.status === "rate_limited") {
      return { kind: "error" as const, text: "GitHub 公开接口请求过于频繁，请稍后再试。" };
    }
    return null;
  });

  constructor() {
    void this.loadBinding();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void this.bindUsername(this.draft());
  }

  protected onOpenProfile(event: Event, url: string): void {
    event.preventDefault();
    void router.open(url);
  }

  private async loadBinding(): Promise<void> {
    this.state.set({ status: "loading" });
    try {
      const next = await invoke<Record<string, never>, GithubLookup>("getGithubUser", {});
      this.applyLookup(next, { clearDraft: true });
    } catch (error: unknown) {
      this.state.set({ status: "error", message: errorMessage(error) });
    }
  }

  private async bindUsername(name: string): Promise<void> {
    const trimmed = name.trim() || this.displayUsername();
    if (!trimmed) {
      this.state.set({ status: "error", message: "请输入 GitHub 用户名" });
      return;
    }
    this.state.set({ status: "loading" });
    try {
      const next = await invoke<{ username: string }, GithubLookup>("getGithubUser", {
        username: trimmed,
      });
      this.applyLookup(next, { clearDraft: next.status === "ready" });
    } catch (error: unknown) {
      this.state.set({ status: "error", message: errorMessage(error) });
    }
  }

  private applyLookup(next: GithubLookup, options: { clearDraft: boolean }): void {
    if (next.status === "ready") {
      this.displayUsername.set(next.username);
      this.bound.set(next.bound);
      this.profile.set(next.profile);
      if (options.clearDraft) {
        this.draft.set("");
      }
      this.state.set(next);
      return;
    }

    this.state.set(next);
  }
}
