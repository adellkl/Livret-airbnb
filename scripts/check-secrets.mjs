import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{70,}\b/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /"type"\s*:\s*"service_account"/,
  // Catch even short hard-coded credentials; minimum-length heuristics miss demo passwords.
  /\b\w*(?:password|passwd|pass|secret|client[_-]?secret|private[_-]?key|access[_-]?token|refresh[_-]?token|auth[_-]?token|webhook[_-]?secret)\s*[:=]\s*(["'])(?!\/)[^"']+\1/i,
  // Also catch non-empty values in environment-file style assignments.
  /^[ \t]*[A-Z0-9_]*(?:PASSWORD|PASSWD|SECRET|PRIVATE_KEY|ACCESS_TOKEN|REFRESH_TOKEN|AUTH_TOKEN)[ \t]*=[ \t]*[^\s#]+/im,
];
const sensitivePath = (path) => /(?:^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith('/.env.example') && path !== '.env.example'
  || /\.(?:pem|key|p12|pfx|swp|swo)$/.test(path)
  || /(?:service-account|serviceAccount|firebase-adminsdk).*\.json$/i.test(path);
const hasSecret = (value) => patterns.some((pattern) => pattern.test(value));
const issues = new Set();
// Frozen demo fixtures removed by 321e387. Only these exact historical blobs
// are acknowledged: current files and new revisions still get every check.
const historicalDemoBlobs = new Map([
  ['src/config/demo.ts', new Set(['fc710be08ee2ea5a0063ac4aecb4cf818a469722'])],
  ['src/lib/owner-properties.ts', new Set([
    '75554787c6faaef7890ba2b2a7a76a5ca0c83748',
    'a4d80e0fa1560db421d4f427f42563a6d1dba4a1',
    '12cc6479681857f94cdef68b2d6f1cda952f16fe',
    'b7aaa71275146cdc22dcd837a29ac275e4b04f16',
    'fead1ef0bbe3a0de869fe896b4676ff034851008',
  ])],
]);

if (process.argv.includes('--history')) {
  // Inspect every reachable version of changed files without printing secret values.
  const commits = git('rev-list', '--all').trim().split('\n').filter(Boolean);
  for (const commit of commits) {
    const paths = git('diff-tree', '--root', '--no-commit-id', '--diff-filter=AM', '--name-only', '-r', commit)
      .split('\n')
      .filter(Boolean);
    for (const path of paths) {
      if (sensitivePath(path)) issues.add(`Fichier sensible dans l’historique : ${path}`);
      const content = execFileSync('git', ['show', `${commit}:${path}`], { maxBuffer: 16 * 1024 * 1024 });
      if (!content.includes(0) && hasSecret(content.toString('utf8'))) {
        const blob = git('rev-parse', `${commit}:${path}`).trim();
        if (!historicalDemoBlobs.get(path)?.has(blob)) {
          issues.add(`Secret potentiel dans l’historique : ${path}`);
        }
      }
    }
  }
} else {
  // Check both index and working tree; never inspect ignored local credentials.
  const paths = git('ls-files', '-z').split('\0').filter(Boolean);
  for (const path of paths) {
    if (sensitivePath(path)) issues.add(`Fichier sensible suivi : ${path}`);
    const staged = execFileSync('git', ['show', `:${path}`], { maxBuffer: 16 * 1024 * 1024 });
    const local = existsSync(path) ? readFileSync(path) : Buffer.alloc(0);
    for (const content of [staged, local]) {
      if (!content.includes(0) && hasSecret(content.toString('utf8'))) issues.add(`Secret potentiel : ${path}`);
    }
  }
}
if (issues.size) {
  console.error([...issues].join('\n'));
  console.error('Contrôle bloqué. Vérifiez les fichiers signalés sans publier leur contenu.');
  process.exitCode = 1;
} else {
  console.log('Aucun secret détecté par les contrôles configurés.');
}
