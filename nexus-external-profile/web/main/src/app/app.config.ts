import { provideHttpClient } from "@angular/common/http";
import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ThyIconRegistry } from "ngx-tethys/icon";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideHttpClient(),
    provideAppInitializer(() => {
      const domSanitizer = inject(DomSanitizer);
      const iconRegistry = inject(ThyIconRegistry);
      const iconSetUrl = new URL("assets/icons/defs/svg/sprite.defs.svg", document.baseURI).toString();
      iconRegistry.addSvgIconSet(domSanitizer.bypassSecurityTrustResourceUrl(iconSetUrl));
    }),
  ],
};
