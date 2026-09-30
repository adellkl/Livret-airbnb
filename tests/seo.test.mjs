import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function load(file, env = {}, dependencies = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  runInNewContext(source, { exports, URL, process: { env }, require: (name) => {
    assert.ok(name in dependencies, `unexpected import: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

test('canonical domain never inherits a Vercel preview URL', () => {
  const seo = load('src/lib/seo.ts', { NODE_ENV: 'production', VERCEL_URL: 'preview.example.test', VERCEL_ENV: 'preview' });
  assert.equal(seo.siteUrl, 'https://monlivret.eu');
  assert.equal(seo.isIndexable, false);
  assert.equal(seo.pageMetadata('/').robots.index, false);
});
test('custom canonical origin is normalized and public pages are unique', () => {
  const seo = load('src/lib/seo.ts', { NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: 'https://example.test/' });
  const titles = new Set();
  for (const page of seo.publicPages) {
    const metadata = seo.pageMetadata(page.path);
    titles.add(metadata.title.absolute);
    assert.equal(metadata.alternates.canonical, `https://example.test${page.path}`);
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.equal(metadata.robots.index, true);
  }
  assert.equal(titles.size, seo.publicPages.length);
});
test('development and explicit opt-out cannot be indexed', () => {
  for (const env of [{ NODE_ENV: 'development' }, { NODE_ENV: 'production', SEO_INDEXABLE: 'false' }]) {
    const seo = load('src/lib/seo.ts', env);
    assert.equal(seo.isIndexable, false);
    const sitemap = load('src/app/sitemap.ts', env, { '@/lib/seo': seo }).default();
    assert.equal(sitemap.length, 0);
  }
});
test('sitemap contains only the six public pages and no private URLs', () => {
  const seo = load('src/lib/seo.ts', { NODE_ENV: 'production' });
  const sitemap = load('src/app/sitemap.ts', {}, { '@/lib/seo': seo }).default();
  assert.equal(sitemap.length, 6);
  for (const entry of sitemap) assert.ok(!/guide\/|proprietaire|admin|connexion|inscription/.test(entry.url));
  assert.equal(seo.privateMetadata.robots.index, false);
});
test('robots allows private page shells to expose their noindex directive', () => {
  const seo = load('src/lib/seo.ts', { NODE_ENV: 'production' });
  const robots = load('src/app/robots.ts', {}, { '@/lib/seo': seo }).default();
  assert.equal(robots.sitemap, 'https://monlivret.eu/sitemap.xml');
  assert.equal(robots.rules.allow, '/');
  assert.deepEqual(Array.from(robots.rules.disallow), ['/api/']);
});
