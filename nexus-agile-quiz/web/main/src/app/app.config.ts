import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from "@angular/core";
import { i18n } from "@pc-nexus/bridge";
import { TranslatorService } from "./i18n/translator.service";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAppInitializer(async () => {
      const translatorService = inject(TranslatorService);
      translatorService.setTranslator(await i18n.createTranslator());
    }),
  ],
};
