import { provideHttpClient } from "@angular/common/http";
import {
  type ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from "@angular/core";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { ThyIconRegistry } from "ngx-tethys/icon";
import { ThyTooltipModule } from "ngx-tethys/tooltip";

const copyIcon = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g stroke-width="1" fill-rule="evenodd"><g transform="translate(2 -.27)" fill-rule="nonzero"><path d="M5.6 8.47v-1.2h4.174v1.2H5.6zm0 3v-1.2h4.174v1.2H5.6zm-4.4-10v10.075H0L.003 2.27c0-1.088.895-2 1.997-2h7.585v1.2H1.2zm1.8.8h9a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1v-12a1 1 0 011-1zm.2 1.2v11.6h8.6V3.47H3.2z"/></g></g></svg>`;

const checkCircleFillIcon = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g stroke-width="1" fill-rule="evenodd"><path d="M0 8c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8zm7.097.758L5.199 6.905l-.978 1.001 2.9 2.833 4.563-4.685-1.003-.977-3.584 3.68z"/></g></svg>`;

const closeCircleFillIcon = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g stroke-width="1" fill-rule="evenodd"><path d="M0 8c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8zm9.005.021l1.777-1.793-.994-.986-1.769 1.784L6.28 5.27l-.995.985 1.75 1.767-1.766 1.782.995.985 1.756-1.772 1.702 1.718.995-.985L9.005 8.02z"/></g></svg>`;

const jumpIcon = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g stroke-width="1" fill-rule="evenodd"><path d="M9.4 2a.6.6 0 110 1.2L8 3.199V3.2H2.2v10.6h11.6L13.798 9h.002v-.4a.6.6 0 011.2 0v.8l-.001.01L15 14a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1h7.4zM11.965.217l3.813 3.681c.113.11.174.254.182.4v.04l-.001.042a.591.591 0 01-.181.4l-3.813 3.682a.6.6 0 11-.833-.864L13.925 4.9l-.166.004C10.319 5.01 7.6 7.407 7.6 10.3a.6.6 0 01-1.2 0c0-3.622 3.338-6.528 7.447-6.599L11.132 1.08a.6.6 0 11.833-.863z"/></g></svg>`;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideAnimationsAsync(),
    importProvidersFrom(ThyTooltipModule),
    provideAppInitializer(() => {
      const icons = inject(ThyIconRegistry);
      icons.addSvgIconLiteral("copy", copyIcon);
      icons.addSvgIconLiteral("check-circle-fill", checkCircleFillIcon);
      icons.addSvgIconLiteral("close-circle-fill", closeCircleFillIcon);
      icons.addSvgIconLiteral("publish", jumpIcon);
    }),
  ],
};
