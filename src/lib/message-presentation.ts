export function formatMessageTime(date: Date | null) {
  if (!date) return 'À l’instant';

  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatMessageDateTime(date: Date | null) {
  if (!date) return 'À l’instant';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
