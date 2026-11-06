import {
  type ApplicationConfig,
  inject,
  importProvidersFrom,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from "@angular/core";
import { provideAnimations } from "@angular/platform-browser/animations";
import { DomSanitizer } from "@angular/platform-browser";
import { ThyDialogModule } from "ngx-tethys/dialog";
import { ThyIconRegistry } from "ngx-tethys/icon";
import { ThyMessageModule } from "ngx-tethys/message";
import { THY_NOTIFY_DEFAULT_CONFIG, ThyNotifyModule } from "ngx-tethys/notify";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimations(),
    importProvidersFrom(ThyDialogModule, ThyMessageModule, ThyNotifyModule),
    {
      provide: THY_NOTIFY_DEFAULT_CONFIG,
      useValue: { placement: "bottomLeft" },
    },
    provideAppInitializer(() => {
      const domSanitizer = inject(DomSanitizer);
      const iconRegistry = inject(ThyIconRegistry);
      const iconSetUrl = new URL(
        "assets/icons/defs/svg/sprite.defs.svg",
        document.baseURI,
      ).toString();
      iconRegistry.addSvgIconSet(
        domSanitizer.bypassSecurityTrustResourceUrl(iconSetUrl),
      );
    }),
  ],
};
