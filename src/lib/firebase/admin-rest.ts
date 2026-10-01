import { createSign } from 'node:crypto';

type ServiceAccount = {
  project_id?: string;
  client_email: string;
  private_key: string;
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, { stringValue?: string }>;
};

type ApiErrorCode = 'configuration' | 'unauthorized' | 'forbidden' | 'not-found' | 'conflict' | 'firebase-admin';

export class FirebaseAdminRestError extends Error {
  constructor(public readonly code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'FirebaseAdminRestError';
  }
}

const propertyCollections = [
  'public_guides',
  'reservations',
  'guide_sections',
  'property_amenities',
  'equipment_guides',
  'property_house_rules',
  'property_faqs',
  'nearby_places',
  'guide_events',
  'guide_reviews',
  'guide_messages',
];

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
      if (parsed.client_email && parsed.private_key) {
        return {
          project_id: parsed.project_id,
          client_email: parsed.client_email,
          private_key: parsed.private_key.replace(/\\n/g, '\n'),
        };
      }
    } catch {
      return null;
    }
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!clientEmail || !privateKey) return null;
  return {
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, '\n'),
  };
}

function projectIdFor(account: ServiceAccount) {
  return process.env.FIREBASE_ADMIN_PROJECT_ID
    || account.project_id
    || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    || '';
}

export function isAdminDeletionConfigured() {
  const account = readServiceAccount();
  return Boolean(account?.client_email && account.private_key && projectIdFor(account));
}

function base64UrlJson(value: Record<string, string | number>) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

async function getServiceAccessToken(account: ServiceAccount) {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }

  const now = Math.floor(Date.now() / 1000);
  const unsignedAssertion = [
    base64UrlJson({ alg: 'RS256', typ: 'JWT' }),
    base64UrlJson({
      iss: account.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  ].join('.');
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedAssertion);
  signer.end();
  const assertion = `${unsignedAssertion}.${signer.sign(account.private_key, 'base64url')}`;
  const form = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  let response: Response;
  try {
    response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      cache: 'no-store',
    });
  } catch {
    throw new FirebaseAdminRestError('firebase-admin', 'Connexion impossible aux services Google.');
  }

  const result = await response.json().catch(() => null) as { access_token?: string; expires_in?: number } | null;
  if (!response.ok || !result?.access_token) {
    throw new FirebaseAdminRestError('configuration', 'Les identifiants serveur Firebase Admin sont invalides ou expirés.');
  }

  cachedAccessToken = {
    value: result.access_token,
    expiresAt: Date.now() + (result.expires_in ?? 3600) * 1000,
  };
  return result.access_token;
}

function documentsRoot(projectId: string) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
}

async function firestoreRequest(url: string, accessToken: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new FirebaseAdminRestError('firebase-admin', 'Connexion impossible à Firestore.');
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new FirebaseAdminRestError('configuration', 'Le compte de service n’a pas les autorisations Firestore requises.');
    }
    throw new FirebaseAdminRestError('firebase-admin', 'Firestore a refusé l’opération. Vous pourrez réessayer la suppression.');
  }
  return response;
}

async function getDocument(projectId: string, path: string, accessToken: string) {
  const response = await fetch(`${documentsRoot(projectId)}/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  }).catch(() => {
    throw new FirebaseAdminRestError('firebase-admin', 'Connexion impossible à Firestore.');
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    if (response.status === 403) {
      throw new FirebaseAdminRestError('configuration', 'Le compte de service n’a pas les autorisations Firestore requises.');
    }
    throw new FirebaseAdminRestError('firebase-admin', 'Impossible de vérifier le profil dans Firestore.');
  }
  return await response.json() as FirestoreDocument;
}

function stringField(document: FirestoreDocument, name: string) {
  return document.fields?.[name]?.stringValue ?? '';
}

async function queryDocuments(
  projectId: string,
  accessToken: string,
  collection: string,
  field: string,
  value: string,
) {
  const response = await firestoreRequest(`${documentsRoot(projectId)}:runQuery`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: 'EQUAL',
            value: { stringValue: value },
          },
        },
        limit: 450,
      },
    }),
  });
  const results = await response.json() as Array<{ document?: FirestoreDocument }>;
  return results.flatMap((result) => result.document ? [result.document] : []);
}

async function deleteDocuments(projectId: string, accessToken: string, documents: FirestoreDocument[]) {
  if (!documents.length) return 0;
  await firestoreRequest(`${documentsRoot(projectId)}:commit`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ writes: documents.map((document) => ({ delete: document.name })) }),
  });
  return documents.length;
}

async function deleteByField(projectId: string, accessToken: string, collection: string, field: string, value: string) {
  let deleted = 0;
  // Each pass removes the first page, so repeated queries do not skip rows as offsets shift.
  for (let page = 0; page < 250; page += 1) {
    const documents = await queryDocuments(projectId, accessToken, collection, field, value);
    if (!documents.length) return deleted;
    deleted += await deleteDocuments(projectId, accessToken, documents);
    if (documents.length < 450) return deleted;
  }
  throw new FirebaseAdminRestError('firebase-admin', 'La suppression dépasse la limite de sécurité prévue. Réessayez après vérification.');
}

async function writeProfileStatus(projectId: string, accessToken: string, uid: string, status: string) {
  await firestoreRequest(`${documentsRoot(projectId)}:commit`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      writes: [{
        update: {
          name: `projects/${projectId}/databases/(default)/documents/profiles/${uid}`,
          fields: { accountStatus: { stringValue: status } },
        },
        updateMask: { fieldPaths: ['accountStatus'] },
      }],
    }),
  });
}

async function deleteAuthUser(projectId: string, accessToken: string, uid: string) {
  let response: Response;
  try {
    response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:delete', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ localId: uid, targetProjectId: projectId }),
      cache: 'no-store',
    });
  } catch {
    throw new FirebaseAdminRestError('firebase-admin', 'Connexion impossible au service Firebase Authentication. Réessayez la suppression.');
  }

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 400 && errorBody.includes('USER_NOT_FOUND')) return;
    if (response.status === 403) {
      throw new FirebaseAdminRestError('configuration', 'Le compte de service n’a pas l’autorisation de supprimer les comptes Firebase Authentication.');
    }
    throw new FirebaseAdminRestError('firebase-admin', 'Firebase Authentication a refusé la suppression. Le compte reste bloqué et la suppression peut être relancée.');
  }
}

export async function authorizeFirebaseAdmin(idToken: string) {
  const account = readServiceAccount();
  const projectId = account ? projectIdFor(account) : '';
  if (!account || !projectId) {
    throw new FirebaseAdminRestError('configuration', 'La suppression définitive n’est pas configurée sur le serveur.');
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new FirebaseAdminRestError('configuration', 'La clé API Firebase du projet est manquante.');

  let lookup: Response;
  try {
    lookup = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      cache: 'no-store',
    });
  } catch {
    throw new FirebaseAdminRestError('firebase-admin', 'Connexion impossible au service Firebase Authentication.');
  }
  const identity = await lookup.json().catch(() => null) as { users?: Array<{ localId?: string }> } | null;
  const uid = identity?.users?.[0]?.localId;
  if (!lookup.ok || !uid) throw new FirebaseAdminRestError('unauthorized', 'Votre session administrateur a expiré. Reconnectez-vous.');

  const accessToken = await getServiceAccessToken(account);
  const profile = await getDocument(projectId, `profiles/${encodeURIComponent(uid)}`, accessToken);
  if (!profile || stringField(profile, 'role') !== 'admin' || ['suspended', 'deleting'].includes(stringField(profile, 'accountStatus'))) {
    throw new FirebaseAdminRestError('forbidden', 'Cette action est réservée à un compte administrateur actif.');
  }

  return { uid, projectId, accessToken };
}

export async function deleteOwnerAccount({
  idToken,
  targetUid,
  confirmationEmail,
}: {
  idToken: string;
  targetUid: string;
  confirmationEmail: string;
}) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(targetUid)) {
    throw new FirebaseAdminRestError('not-found', 'Compte introuvable.');
  }
  const admin = await authorizeFirebaseAdmin(idToken);
  if (admin.uid === targetUid) {
    throw new FirebaseAdminRestError('conflict', 'Vous ne pouvez pas supprimer votre propre compte administrateur.');
  }

  const target = await getDocument(admin.projectId, `profiles/${encodeURIComponent(targetUid)}`, admin.accessToken);
  if (!target) throw new FirebaseAdminRestError('not-found', 'Le profil de ce compte est introuvable.');
  if (stringField(target, 'role') !== 'owner') {
    throw new FirebaseAdminRestError('forbidden', 'Seuls les comptes propriétaires peuvent être supprimés depuis cette page.');
  }

  const email = stringField(target, 'email').trim().toLocaleLowerCase('fr-FR');
  if (!email || confirmationEmail.trim().toLocaleLowerCase('fr-FR') !== email) {
    throw new FirebaseAdminRestError('conflict', 'Saisissez l’adresse e-mail exacte du compte pour confirmer sa suppression.');
  }

  // Mark the account first. Login guards and Firestore rules use this status,
  // making a failed multi-step deletion safe to retry without restoring access.
  await writeProfileStatus(admin.projectId, admin.accessToken, targetUid, 'deleting');

  let deletedDocuments = 0;
  let deletedProperties = 0;
  for (let page = 0; page < 250; page += 1) {
    const ownerProperties = await queryDocuments(admin.projectId, admin.accessToken, 'properties', 'ownerId', targetUid);
    if (!ownerProperties.length) break;

    for (const property of ownerProperties) {
      const propertyId = property.name.split('/').at(-1);
      if (!propertyId) continue;
      for (const collection of propertyCollections) {
        deletedDocuments += await deleteByField(admin.projectId, admin.accessToken, collection, 'propertyId', propertyId);
      }
      // Older public guide mirrors may use the token as their document ID.
      const guideIds = new Set([propertyId, stringField(property, 'publicToken')].filter(Boolean));
      for (const guideId of guideIds) {
        const guide = await getDocument(admin.projectId, `public_guides/${encodeURIComponent(guideId)}`, admin.accessToken);
        if (guide) {
          const guideUrl = `${documentsRoot(admin.projectId)}/public_guides/${encodeURIComponent(guideId)}`;
          await firestoreRequest(guideUrl, admin.accessToken, { method: 'DELETE' });
          deletedDocuments += 1;
        }
      }
    }

    // The property page is removed only after all of its dependent documents.
    deletedDocuments += await deleteDocuments(admin.projectId, admin.accessToken, ownerProperties);
    deletedProperties += ownerProperties.length;
    if (ownerProperties.length < 450) break;
    if (page === 249) {
      throw new FirebaseAdminRestError('firebase-admin', 'La suppression dépasse la limite de sécurité prévue. Réessayez après vérification.');
    }
  }

  for (const collection of ['public_guides', 'reservations', 'guide_events', 'guide_reviews', 'guide_messages']) {
    deletedDocuments += await deleteByField(admin.projectId, admin.accessToken, collection, 'ownerId', targetUid);
  }

  // Authentication is removed after the Firestore data. If this call fails,
  // the deleting status continues to block login and the admin can retry.
  await deleteAuthUser(admin.projectId, admin.accessToken, targetUid);
  const profile = await getDocument(admin.projectId, `profiles/${encodeURIComponent(targetUid)}`, admin.accessToken);
  if (profile) {
    await firestoreRequest(`${documentsRoot(admin.projectId)}/profiles/${encodeURIComponent(targetUid)}`, admin.accessToken, { method: 'DELETE' });
    deletedDocuments += 1;
  }

  return { deletedDocuments, deletedProperties };
}
