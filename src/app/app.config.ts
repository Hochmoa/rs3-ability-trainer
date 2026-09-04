import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';

import { routes } from './app.routes';
import { ErrorReportService } from './core/error-report.service';
import { SeoService, SeoTitleStrategy } from './seo/seo.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // every uncaught error (Angular, window error, unhandled rejection) goes to the client_errors table
    { provide: ErrorHandler, useExisting: ErrorReportService },
    provideRouter(routes),
    provideHttpClient(),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    provideAppInitializer(() => inject(SeoService).init()),
  ],
};
