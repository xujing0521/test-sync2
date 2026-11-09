import { Injectable, signal } from "@angular/core";
import type { TranslationsResourceContent, Translator } from "@pc-nexus/bridge";

@Injectable({ providedIn: "root" })
export class TranslatorService {
  private readonly translator = signal<Translator | undefined>(undefined);

  setTranslator(translator: Translator) {
    this.translator.set(translator);
  }

  translate(key: string, params?: Record<string, unknown>): TranslationsResourceContent | string {
    return this.translator()?.translate(key, params) ?? key;
  }
}
