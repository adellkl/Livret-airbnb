import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { getFirebaseServer } from '@/lib/firebase/server';
import { consumeEmailWindow } from './limits';
import { type AccountEmailKind } from './templates';

export const emailHash = (value: string) => createHash('sha256').update(value).digest('hex');

export class EmailLimitError extends Error {
  constructor(public readonly scope: string) { super('email/rate-limited'); }
}

// Transactions partagées entre toutes les instances Vercel. Aucune adresse,
// aucun mot de passe et aucun lien d'action ne sont stockés dans les journaux.
export async function reserveAccountEmail(kind: AccountEmailKind, recipient: string, ip: string, uid?: string) {
  const { db } = getFirebaseServer();
  const now = Date.now();
  const recipientHash = emailHash(recipient);
  const budgets = [
    { key: `recipient-${recipientHash}`, limit: 5, duration: 3600_000, cooldown: 60_000 },
    { key: `ip-${emailHash(ip)}`, limit: 15, duration: 3600_000, cooldown: 0 },
    { key: 'gmail-account', limit: 400, duration: 86400_000, cooldown: 0 },
  ];
  const eventId = kind === 'welcome' ? `welcome-${emailHash(uid!)}` : randomUUID();
  const eventRef = db.collection('email_deliveries').doc(eventId);
  const refs = budgets.map((budget) => db.collection('email_rate_limits').doc(budget.key));
  const reserved = await db.runTransaction(async (transaction) => {
    const [event, ...snapshots] = await transaction.getAll(eventRef, ...refs);
    if (event.exists && (event.get('status') === 'accepted'
      || (event.get('status') === 'sending' && event.get('leaseUntil') > now))) return false;
    const windows = budgets.map((budget, index) => {
      const next = consumeEmailWindow(snapshots[index].data(), now, budget.limit, budget.duration, budget.cooldown);
      if (!next) throw new EmailLimitError(budget.key.startsWith('recipient-') ? 'recipient' : 'global');
      return next;
    });
    refs.forEach((ref, index) => transaction.set(ref, windows[index]));
    transaction.set(eventRef, { kind, recipientHash, status: 'sending', createdAt: now, leaseUntil: now + 120_000 });
    return true;
  });
  return reserved ? {
    async finish(status: 'accepted' | 'failed' | 'skipped', code?: string) {
      await eventRef.update({ status, completedAt: Date.now(), ...(code ? { code } : {}) });
    },
  } : null;
}
