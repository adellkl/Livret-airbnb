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
  /(?:password|passwd|api_secret|client_secret|access_token|refresh_token)\s*[:=]\s*["'][^"'/\s][^"'\s]{15,}["']/i,
];
const sensitivePath = (path) => /(?:^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith('/.env.example') && path !== '.env.example'
  || /\.(?:pem|key|p12|pfx|swp|swo)$/.test(path)
  || /(?:service-account|serviceAccount|firebase-adminsdk).*\.json$/i.test(path);
const hasSecret = (value) => patterns.some((pattern) => pattern.test(value));
const issues = new Set();

if (process.argv.includes('--history')) {
  // Inspect every reachable commit, including deleted files, without echoing values.
  const history = git('log', '--all', '-p', '--format=', '--no-ext-diff', '--no-textconv');
  if (hasSecret(history)) issues.add('Un secret potentiel apparaît dans l’historique Git.');
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
