'use client';

import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, reload } from 'firebase/auth';
import { Mail } from 'lucide-react';
import { firebaseAuth } from '@/lib/firebase/client';
import { sendRegistrationConfirmation } from '@/lib/firebase/account-emails';
import { Button } from '@/components/ui/button';

export default function EmailVerificationNotice({ initialStatus }: { initialStatus?: 'sent' | 'failed' }) {
  const [email, setEmail] = useState<string | null>(null);
  const [message, setMessage] = useState(initialStatus === 'sent'
    ? 'Le lien de confirmation a été envoyé. Pensez à vérifier vos courriers indésirables.'
    : 'Confirmez votre adresse e-mail pour finaliser votre inscription.');
  const [error, setError] = useState(initialStatus === 'failed'
    ? 'Votre compte est créé, mais l’e-mail de confirmation n’a pas pu être envoyé. Réessayez ci-dessous.'
    : '');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(initialStatus === 'sent' ? 60 : 0);
  const actionInProgress = useRef(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, (user) => {
    setEmail(user && !user.emailVerified ? user.email : null);
  }), []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timeout = window.setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [cooldown]);

  const act = async (resend: boolean) => {
    const user = firebaseAuth.currentUser;
    if (!user || actionInProgress.current || (resend && cooldown > 0)) return;
    actionInProgress.current = true;
    setBusy(true);
    setError('');
    try {
      await reload(user);
      if (firebaseAuth.currentUser?.uid !== user.uid) return;
      if (user.emailVerified) {
        await user.getIdToken(true);
        setEmail(null);
      } else if (resend) {
        await sendRegistrationConfirmation(user);
        setCooldown(60);
        setMessage('Le lien de confirmation a été envoyé. Pensez à vérifier vos courriers indésirables.');
      } else {
        setMessage('Votre adresse n’est pas encore confirmée. Cliquez sur le lien reçu par e-mail, puis réessayez.');
      }
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      if (code === 'auth/too-many-requests') setCooldown(60);
      setError(code === 'auth/too-many-requests'
        ? 'Veuillez patienter avant de demander un nouveau lien.'
        : 'L’opération n’a pas abouti. Vérifiez votre connexion et réessayez.');
    } finally {
      actionInProgress.current = false;
      setBusy(false);
    }
  };

  if (!email) return null;

  return (
    <section aria-label="Confirmation de votre adresse e-mail" className="mb-6 rounded-2xl border border-[#e9d5c3] bg-[#fff8ef] p-5 text-[#1f2925]">
      <div className="flex items-start gap-3">
        <Mail size={20} className="mt-0.5 shrink-0 text-[#b85d39]" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Confirmez votre adresse e-mail</h2>
          <p className="mt-1 break-words text-sm">{email}</p>
          <p role="status" className="mt-2 text-sm leading-6">{message}</p>
          {error && <p role="alert" className="mt-2 text-sm text-[#a6342b]">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={busy || cooldown > 0} onClick={() => void act(true)}>
              {cooldown > 0 ? `Renvoyer dans ${cooldown} s` : 'Renvoyer le lien'}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void act(false)}>J’ai confirmé mon adresse</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
