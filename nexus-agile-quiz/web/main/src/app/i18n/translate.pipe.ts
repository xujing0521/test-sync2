import { Pipe, type PipeTransform, inject } from "@angular/core";
import { TranslatorService } from "./translator.service";

@Pipe({
  name: "translate",
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly translatorService = inject(TranslatorService);

  transform(key: string, params?: Record<string, unknown>): string {
    return this.translatorService.translate(key, params) as string;
  }
}
