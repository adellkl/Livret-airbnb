import assert from 'node:assert/strict';
import test from 'node:test';
import { renderAccountEmail, escapeEmailHtml } from '../src/lib/email/templates';
import { accountActionUrl, EMAIL_SENDER, emailAppOrigin } from '../src/lib/email/config';
import { consumeEmailWindow } from '../src/lib/email/limits';
import { POST } from '../src/app/api/account-emails/route';

test('all templates have a French subject, text alternative, fixed reply address and an action', () => {
  for (const kind of ['verification', 'password-reset', 'welcome'] as const) {
    const email = renderAccountEmail(kind, 'https://monlivret.eu/confirmer-adresse?oobCode=example');
    assert.match(email.html, /<html lang="fr">/);
    assert.match(email.subject, /Mon Livret/);
    assert.match(email.text, /Bonjour/);
    assert.match(email.text, /monlivret\.1@gmail\.com/);
    assert.match(email.html, /role="presentation"/);
    assert.match(email.html, /href="https:\/\/monlivret.eu\//);
  }
  assert.deepEqual(EMAIL_SENDER, { name: 'Mon Livret', address: 'monlivret.1@gmail.com' });
});

test('HTML injection and unsafe action URLs are rejected or escaped', () => {
  assert.equal(escapeEmailHtml('<script>"&\'</script>'), '&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;');
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'https://user:password@example.com', 'http://example.com']) {
    assert.throws(() => renderAccountEmail('verification', url));
  }
  const email = renderAccountEmail('verification', 'https://monlivret.eu/?a=1&b=2');
  assert.match(email.html, /a=1&amp;b=2/);
});

test('custom action links preserve only the Firebase code, never an arbitrary redirect', () => {
  const original = 'https://project.firebaseapp.com/__/auth/action?oobCode=a%2Bb%26c&continueUrl=https://evil.example';
  const verification = new URL(accountActionUrl(original, 'verification', 'https://monlivret.eu'));
  assert.equal(verification.pathname, '/confirmer-adresse');
  assert.equal(verification.searchParams.get('oobCode'), 'a+b&c');
  assert.equal(verification.searchParams.has('continueUrl'), false);
  assert.equal(new URL(accountActionUrl(original, 'password-reset', 'https://monlivret.eu')).pathname, '/reinitialiser-mot-de-passe');
  assert.throws(() => accountActionUrl('https://example.com/', 'verification', 'https://monlivret.eu'));
});

test('rate limits block a burst, enforce the window cap and reopen after expiry', () => {
  const first = consumeEmailWindow(undefined, 1_000_000, 2, 3600_000, 60_000)!;
  assert.equal(first.count, 1);
  assert.equal(consumeEmailWindow(first, 1_000_001, 2, 3600_000, 60_000), null);
  const second = consumeEmailWindow(first, 1_060_000, 2, 3600_000, 60_000)!;
  assert.equal(second.count, 2);
  assert.equal(consumeEmailWindow(second, 1_120_000, 2, 3600_000, 60_000), null);
  assert.equal(consumeEmailWindow(second, first.resetAt, 2, 3600_000, 60_000)?.count, 1);
});

const request = (body: unknown, headers: Record<string, string> = {}) => new Request('https://monlivret.eu/api/account-emails', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
});

test('the endpoint cannot be used as an arbitrary mail relay', async () => {
  for (const body of [
    { kind: 'verification', email: 'victim@example.com' },
    { kind: 'welcome', to: 'victim@example.com' },
    { kind: 'password-reset', email: 'valid@example.com', from: 'fake@example.com' },
    { kind: 'password-reset', email: 'valid@example.com', html: '<b>spam</b>' },
    { kind: 'newsletter', email: 'valid@example.com' },
    { kind: 'password-reset', email: 'valid@example.com\r\nBcc: victim@example.com' },
  ]) assert.equal((await POST(request(body))).status, 400);
});

test('cross-origin requests are rejected before any email is sent', async () => {
  assert.equal((await POST(request({ kind: 'verification' }, { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await POST(request({ kind: 'verification' }, { 'sec-fetch-site': 'cross-site' }))).status, 403);
});

test('oversized or malformed request bodies are rejected', async () => {
  assert.equal((await POST(request({ kind: 'password-reset', email: 'a'.repeat(3000) }))).status, 400);
  assert.equal((await POST(new Request('https://monlivret.eu/api/account-emails', { method: 'POST', body: '{invalid' }))).status, 400);
});

test('missing Gmail credentials produce an explicit service error, never a false success', async () => {
  const previous = process.env.GMAIL_APP_PASSWORD;
  delete process.env.GMAIL_APP_PASSWORD;
  try {
    const response = await POST(request({ kind: 'password-reset', email: 'user@example.com' }));
    assert.equal(response.status, 503);
    const result = await response.json();
    assert.equal(result.success, undefined);
    assert.equal(result.oobCode, undefined);
    assert.equal(result.link, undefined);
  } finally {
    if (previous !== undefined) process.env.GMAIL_APP_PASSWORD = previous;
  }
});

test('email URLs use a configured origin and never embed credentials', () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  try {
    process.env.NEXT_PUBLIC_APP_URL = 'https://monlivret.eu/path';
    assert.equal(emailAppOrigin(), 'https://monlivret.eu');
    process.env.NEXT_PUBLIC_APP_URL = 'https://user:secret@monlivret.eu';
    assert.throws(emailAppOrigin);
    process.env.NEXT_PUBLIC_APP_URL = 'javascript:alert(1)';
    assert.throws(emailAppOrigin);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  }
});
