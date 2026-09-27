export function formatMessageTime(date: Date | null) {
  if (!date) return 'À l’instant';

  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
