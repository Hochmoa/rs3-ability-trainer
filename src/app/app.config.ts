import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, TitleStrategy, provideRouter, withNavigationErrorHandler, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { ErrorReportService } from './core/error-report.service';
import { SeoService, SeoTitleStrategy } from './seo/seo.service';

const RELOAD_KEY = 'rs3trainer.chunk-reload';

/** `import()` of a lazy route failed (stale hashed chunk after a deploy): reload once, never in a loop. */
export function isChunkLoadError(err: unknown): boolean {
  const text = String((err as { message?: string })?.message ?? err ?? '');
  return /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(text);
}

function reloadOnStaleChunk(err: unknown): void {
  if (!isChunkLoadError(err) || typeof location === 'undefined') return;
  let done = false;
  try {
    done = sessionStorage.getItem(RELOAD_KEY) === location.href;
    if (!done) sessionStorage.setItem(RELOAD_KEY, location.href);
  } catch {
    done = true; // storage blocked: without the guard a reload could loop, so none
  }
  if (!done) location.reload();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // every uncaught error (Angular, window error, unhandled rejection) goes to the client_errors table
    { provide: ErrorHandler, useExisting: ErrorReportService },
    // every page but Train is a lazy chunk with a hashed name: preloading fetches them while index.html is fresh, and a
    // chunk that 404s after a deploy (the open tab still holds the old index.html) reloads the page once
    provideRouter(routes, withPreloading(PreloadAllModules), withNavigationErrorHandler((e) => reloadOnStaleChunk(e.error))),
    provideHttpClient(),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    provideAppInitializer(() => inject(SeoService).init()),
  ],
};
