export const ROUTES = {
  // Public routes
  HOME: '/',
  FEATURES: '/fonctionnalites',
  PRICING: '/tarifs',
  LOGIN: '/connexion',
  REGISTER: '/inscription',
  FORGOT_PASSWORD: '/mot-de-passe-oublie',
  LEGAL: '/mentions-legales',
  PRIVACY: '/confidentialite',
  TERMS: '/conditions-utilisation',

  // Owner space
  OWNER_DASHBOARD: '/proprietaire/tableau-de-bord',
  OWNER_PROPERTIES: '/proprietaire/logements',
  OWNER_PROPERTY_NEW: '/proprietaire/logements/nouveau',
  OWNER_PROPERTY_DETAIL: (id: string) => `/proprietaire/logements/${id}`,
  OWNER_PROPERTY_SHARE: (id: string) => `/proprietaire/logements/${id}/partage`,
  OWNER_BOOKLET_EDITOR: (id: string) => `/proprietaire/livrets/${id}/editeur`,
  OWNER_STATISTICS: '/proprietaire/statistiques',
  OWNER_TRAVELERS: '/proprietaire/voyageurs',
  OWNER_TEAM: '/proprietaire/equipe',
  OWNER_SETTINGS: '/proprietaire/parametres',

  // Admin space
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/utilisateurs',
  ADMIN_ORGANIZATIONS: '/admin/organisations',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_SUPPORT: '/admin/support',
  ADMIN_SUBSCRIPTIONS: '/admin/abonnements',
  ADMIN_BILLING: '/admin/facturation',
  ADMIN_REPORTS: '/admin/rapports',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_SETTINGS: '/admin/parametres',

  // Public booklet
  PUBLIC_BOOKLET: (token: string) => `/guide/${token}`,
} as const;
