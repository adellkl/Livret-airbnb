import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync('src/app/api/property-import/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
function setup(fetch) {
  const exports = {};
  runInNewContext(source, { exports, URL, Buffer, AbortSignal, fetch, require: (name) => {
    assert.equal(name, 'next/server');
    return { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } };
  } });
  return (url) => exports.POST({ json: async () => ({ url }) });
}

test('rejects lookalike domains, non-HTTPS, credentials and custom ports without fetching', async () => {
  const post = setup(() => { throw new Error('must not fetch'); });
  for (const url of ['https://www.google.com.evil.test/maps', 'http://www.airbnb.com/rooms/1', 'https://user:pass@www.airbnb.com', 'https://www.airbnb.com:8080', 'https://127.0.0.1']) {
    assert.equal((await post(url)).status, 400);
  }
});
test('blocks unsafe redirect before sending a request to its destination', async () => {
  const visited = [];
  const post = setup(async (url, options) => {
    visited.push(String(url));
    assert.equal(options.redirect, 'manual');
    return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/admin' } });
  });
  assert.equal((await post('https://goo.gl/maps/example')).status, 422);
  assert.equal(visited.length, 1);
});
test('limits redirect chains', async () => {
  let calls = 0;
  const post = setup(async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: 'https://www.airbnb.com/loop' } });
  });
  assert.equal((await post('https://www.airbnb.com/loop')).status, 422);
  assert.equal(calls, 6);
});
test('limits response bytes even without Content-Length', async () => {
  const post = setup(async () => new Response('x'.repeat(1_500_001)));
  assert.equal((await post('https://www.airbnb.com/rooms/1')).status, 422);
});
test('imports public metadata from a supported French Airbnb URL', async () => {
  const post = setup(async () => new Response('<meta property="og:title" content="Belle maison"><meta property="og:description" content="Bienvenue">'));
  const result = await post('https://www.airbnb.fr/rooms/1');
  assert.equal(result.status, 200);
  assert.equal(result.body.name, 'Belle maison');
});
