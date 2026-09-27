const blockedMessageTerms = [
  'connard',
  'connasse',
  'encule',
  'enfoire',
  'salope',
  'pute',
  'pedale',
];

export function containsBlockedMessageTerm(message: string) {
  const normalized = message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr');

  return blockedMessageTerms.some((term) =>
    new RegExp(`(^|[^a-z])${term}([^a-z]|$)`, 'i').test(normalized),
  );
}
