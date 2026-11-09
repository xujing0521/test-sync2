import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ThyAvatarService, ThyDefaultAvatarService } from 'ngx-tethys/avatar';
import { THY_TOOLTIP_DEFAULT_CONFIG_PROVIDER, ThyTooltipModule } from 'ngx-tethys/tooltip';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    importProvidersFrom(ThyTooltipModule),
    THY_TOOLTIP_DEFAULT_CONFIG_PROVIDER,
    { provide: ThyAvatarService, useClass: ThyDefaultAvatarService },
  ],
};
