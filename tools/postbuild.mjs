/**
 * Runs after `ng build` (see package.json "build"). Turns the single index.html of the SPA into one
 * static HTML file per route so GitHub Pages answers deep links with HTTP 200 and correct metadata
 * instead of the 404.html fallback, plus sitemap.xml, 404.html and CNAME.
 *
 *   node tools/postbuild.mjs
 *
 * Route metadata: src/app/seo/seo-routes.json (shared with the runtime SeoService).
 * Static text per route: tools/seo-content.mjs.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticBody } from './seo-content.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist/rs3-ability-trainer/browser');
const seo = JSON.parse(readFileSync(join(root, 'src/app/seo/seo-routes.json'), 'utf8'));

if (!existsSync(join(out, 'index.html'))) {
  console.error(`postbuild: ${out}/index.html not found – run "ng build" first`);
  process.exit(1);
}
const template = readFileSync(join(out, 'index.html'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const canonical = (path) => seo.origin + '/' + path;

function replaceOrFail(html, re, replacement, what) {
  if (!re.test(html)) throw new Error(`postbuild: could not find ${what} in index.html – src/index.html and tools/postbuild.mjs are out of sync`);
  return html.replace(re, replacement);
}

function jsonLd(route) {
  const url = canonical(route.path);
  const website = {
    '@type': 'WebSite',
    '@id': seo.origin + '/#website',
    name: seo.siteName,
    url: seo.origin + '/',
    description: seo.description,
    inLanguage: 'en',
    publisher: { '@type': 'Person', name: seo.author.name, url: seo.author.url },
  };
  if (route.path === '') {
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
      { '@type': 'WebPage', '@id': url + '#webpage', name: route.h1, url, description: route.description, inLanguage: 'en', isPartOf: { '@id': seo.origin + '/#website' } },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: seo.siteName, item: seo.origin + '/' },
          { '@type': 'ListItem', position: 2, name: route.h1, item: url },
        ],
      },
    ],
  };
}

function page(route, { notFound = false } = {}) {
  const url = canonical(route.path);
  const noindex = notFound || !!route.noindex;
  let html = template;
  html = replaceOrFail(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`, '<title>');
  html = replaceOrFail(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(route.description)}">`, 'description');
  html = replaceOrFail(html, /<link rel="canonical" href="[^"]*">/, noindex ? '' : `<link rel="canonical" href="${esc(url)}">`, 'canonical');
  html = replaceOrFail(html, /<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'}">`, 'robots');
  html = replaceOrFail(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${esc(url)}">`, 'og:url');
  html = replaceOrFail(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(route.title)}">`, 'og:title');
  html = replaceOrFail(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(route.description)}">`, 'og:description');
  html = replaceOrFail(html, /<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(route.title)}">`, 'twitter:title');
  html = replaceOrFail(html, /<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(route.description)}">`, 'twitter:description');
  html = replaceOrFail(html, /<script type="application\/ld\+json" id="ld-json">[\s\S]*?<\/script>/, `<script type="application/ld+json" id="ld-json">${JSON.stringify(jsonLd(route))}</script>`, 'ld+json');
  html = replaceOrFail(html, /<app-root>[\s\S]*?<\/app-root>/, `<app-root>${staticBody(route)}</app-root>`, '<app-root>');
  return html;
}

function lastmod() {
  try {
    return execSync('git log -1 --format=%cI', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const written = [];
for (const route of seo.routes) {
  if (route.noindex) continue;
  const file = route.path === '' ? 'index.html' : `${route.path}.html`;
  mkdirSync(dirname(join(out, file)), { recursive: true });
  writeFileSync(join(out, file), page(route));
  written.push(file);
}

// SPA fallback for everything else (account, auth callback, unknown URLs); GitHub Pages serves it with status 404
writeFileSync(join(out, '404.html'), page({ path: '', title: seo.siteName, h1: seo.siteName, description: seo.description }, { notFound: true }));

const date = lastmod();
const indexable = seo.routes.filter((r) => !r.noindex);
const urls = indexable
  .map(
    (r) => `  <url>
    <loc>${esc(canonical(r.path))}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${r.changefreq ?? 'monthly'}</changefreq>
    <priority>${(r.priority ?? 0.5).toFixed(1)}</priority>
  </url>`,
  )
  .join('\n');
writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
writeFileSync(join(out, 'CNAME'), new URL(seo.origin).host + '\n');

console.log(`postbuild: wrote ${written.join(', ')}, 404.html, sitemap.xml (${indexable.length} urls, lastmod ${date}), CNAME`);
