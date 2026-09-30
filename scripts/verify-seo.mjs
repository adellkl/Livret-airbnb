import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://localhost:3100';
const paths = ['/', '/fonctionnalites', '/tarifs', '/mentions-legales', '/confidentialite', '/conditions-utilisation'];
const titles = new Set();
let origin;
for (const path of paths) {
  const response = await fetch(new URL(path, base), { headers: { 'User-Agent': 'Googlebot' } });
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(title, `title: ${path}`);
  titles.add(title);
  assert.match(html, /name="description" content="[^"]+"/);
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  assert.ok(canonical, `canonical: ${path}`);
  origin ||= new URL(canonical).origin;
  assert.equal(canonical, `${origin}${path}`);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:card"/);
  assert.match(html, /name="robots" content="index, follow"/);
  if (path === '/') {
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    const json = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1];
    assert.ok(json, 'structured data');
    assert.equal(JSON.parse(json)['@graph'].length, 3);
  }
}
assert.equal(titles.size, paths.length);
for (const path of ['/guide/seo-check', '/proprietaire/logements', '/admin', '/connexion', '/inscription', '/mot-de-passe-oublie', '/reinitialiser-mot-de-passe']) {
  const response = await fetch(new URL(path, base), { headers: { 'User-Agent': 'Googlebot' } });
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(await response.text(), /name="robots" content="noindex, nofollow/);
}
const sitemap = await (await fetch(new URL('/sitemap.xml', base))).text();
assert.equal((sitemap.match(/<loc>/g) || []).length, paths.length);
for (const path of paths) assert.ok(sitemap.includes(`<loc>${origin}${path}</loc>`));
const robots = await (await fetch(new URL('/robots.txt', base))).text();
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(!robots.includes('Disallow: /guide'));
console.log('SEO vérifié : 6 pages publiques, 7 routes privées, JSON-LD, sitemap et robots.');
