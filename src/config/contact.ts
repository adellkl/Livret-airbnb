// Adresse publique du projet. L'expéditeur des emails de compte se configure
// séparément dans Firebase Authentication > Modèles > Paramètres SMTP.
export const CONTACT_EMAIL = 'monlivret.1@gmail.com';

export function contactEmailLink(subject?: string) {
  return `mailto:${CONTACT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}
