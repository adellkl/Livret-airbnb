import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

const checker = resolve('scripts/check-secrets.mjs');
const historicalDemo = execFileSync('git', ['show', 'fc710be08ee2ea5a0063ac4aecb4cf818a469722']);

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'monlivret-secret-test-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, stdio: 'pipe' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.name', 'Security test');
  git('config', 'user.email', 'security@example.invalid');
  const save = (path, content) => {
    mkdirSync(dirname(join(cwd, path)), { recursive: true });
    writeFileSync(join(cwd, path), content);
    git('add', '--', path);
    git('-c', 'commit.gpgsign=false', 'commit', '-qm', 'Test fixture');
  };
  const remove = (path) => {
    git('rm', '-q', '--', path);
    git('-c', 'commit.gpgsign=false', 'commit', '-qm', 'Remove fixture');
  };
  const scan = (...args) => spawnSync(process.execPath, [checker, ...args], { cwd, encoding: 'utf8' });
  return { save, remove, scan };
}

test('known demo history is acknowledged but the same content is forbidden in current files', (t) => {
  const repo = fixture(t);
  repo.save('src/config/demo.ts', historicalDemo);
  assert.equal(repo.scan('--history').status, 0);
  assert.equal(repo.scan().status, 1);
  repo.remove('src/config/demo.ts');
  assert.equal(repo.scan().status, 0);
  assert.equal(repo.scan('--history').status, 0);
  repo.save('src/config/demo.ts', Buffer.concat([historicalDemo, Buffer.from('\n// changed revision\n')]));
  assert.equal(repo.scan('--history').status, 1);
});

test('historical exceptions do not apply to another path', (t) => {
  const repo = fixture(t);
  repo.save('src/config/copied-demo.ts', historicalDemo);
  assert.equal(repo.scan('--history').status, 1);
});

test('new credentials remain blocked after removal and their values are never printed', (t) => {
  const repo = fixture(t);
  const key = ['pass', 'word'].join('');
  const value = randomUUID();
  repo.save('fixture.ts', `export const ${key} = ${JSON.stringify(value)};\n`);
  repo.remove('fixture.ts');
  const result = repo.scan('--history');
  assert.equal(result.status, 1);
  assert.equal(repo.scan().status, 0);
  assert.equal(`${result.stdout}${result.stderr}`.includes(value), false);
});
