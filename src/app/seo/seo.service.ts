import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import seo from './seo-routes.json';

/**
 * Per-route SEO metadata. `seo-routes.json` is the single source of truth: this service applies it
 * at runtime (title, description, canonical, Open Graph, robots, JSON-LD) and `tools/postbuild.mjs`
 * bakes the same data into one static HTML file per route for crawlers that do not run JavaScript.
 */
export interface SeoRoute {
  path: string;
  title: string;
  h1: string;
  description: string;
  noindex?: boolean;
}

const ROBOTS_INDEX = 'index,follow,max-image-preview:large';
const ROBOTS_NOINDEX = 'noindex,nofollow';

/** '/rotations?x=1#y' -> 'rotations' */
export function seoPath(url: string): string {
  return url.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
}

export function seoRouteFor(url: string): SeoRoute | undefined {
  const path = seoPath(url);
  return (seo.routes as SeoRoute[]).find((r) => r.path === path);
}

export function canonicalUrl(url: string): string {
  return seo.origin + '/' + seoPath(url);
}

/** Schema.org description of a page; the home page also describes the app itself. */
export function jsonLd(route: SeoRoute | undefined, url: string): object {
  const canonical = canonicalUrl(url);
  const website = {
    '@type': 'WebSite',
    '@id': seo.origin + '/#website',
    name: seo.siteName,
    url: seo.origin + '/',
    description: seo.description,
    inLanguage: 'en',
    publisher: { '@type': 'Person', name: seo.author.name, url: seo.author.url },
  };
  if (!route || route.path === '') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        website,
        {
          '@type': 'WebApplication',
          '@id': seo.origin + '/#app',
          name: seo.siteName,
          url: seo.origin + '/',
          description: seo.description,
          applicationCategory: 'GameApplication',
          operatingSystem: 'Any (web browser)',
          browserRequirements: 'Requires JavaScript',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          image: seo.origin + seo.image,
          inLanguage: 'en',
          author: { '@type': 'Person', name: seo.author.name, url: seo.author.url },
          about: { '@type': 'VideoGame', name: 'RuneScape', url: 'https://www.runescape.com/' },
        },
      ],
    };
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      website,
      {
        '@type': 'WebPage',
        '@id': canonical + '#webpage',
        name: route.h1,
        url: canonical,
        description: route.description,
        inLanguage: 'en',
        isPartOf: { '@id': seo.origin + '/#website' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: seo.siteName, item: seo.origin + '/' },
          { '@type': 'ListItem', position: 2, name: route.h1, item: canonical },
        ],
      },
    ],
  };
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);

  /** Called once at start-up (see app.config.ts). */
  init(): void {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.apply(e.urlAfterRedirects);
    });
  }

  apply(url: string): void {
    const route = seoRouteFor(url);
    const canonical = canonicalUrl(url);
    const title = route?.title ?? this.doc.title;
    const description = route?.description ?? seo.description;
    const noindex = route?.noindex ?? false;

    if (noindex) this.doc.head.querySelector('link[rel="canonical"]')?.remove();
    else this.setLink('canonical', canonical);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    let ld = this.doc.getElementById('ld-json');
    if (!ld) {
      ld = this.doc.createElement('script');
      ld.id = 'ld-json';
      ld.setAttribute('type', 'application/ld+json');
      this.doc.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonLd(route, url));
  }

  private setLink(rel: string, href: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = rel;
      this.doc.head.appendChild(link);
    }
    link.href = href;
  }
}

/** Route titles come from seo-routes.json; the `title` in app.routes.ts is only the fallback. */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const route = seoRouteFor(snapshot.url);
    this.title.setTitle(route?.title ?? this.buildTitle(snapshot) ?? seo.siteName);
  }
}
