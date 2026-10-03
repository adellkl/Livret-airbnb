'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { applyActionCode, checkActionCode, reload } from 'firebase/auth';
import { MailCheck, ShieldAlert } from 'lucide-react';
import AuthCard from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/button';
import { firebaseAuth } from '@/lib/firebase/client';
import { ROUTES } from '@/config/routes';

export default function ConfirmEmailPage() {
  const [state, setState] = useState<'checking' | 'ready' | 'invalid' | 'complete'>('checking');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const actionCode = new URLSearchParams(window.location.search).get('oobCode') || '';
    void checkActionCode(firebaseAuth, actionCode).then((result) => {
      if (!active) return;
      if (result.operation !== 'VERIFY_EMAIL') { setState('invalid'); return; }
      setCode(actionCode);
      setState('ready');
    }).catch(() => { if (active) setState('invalid'); });
    return () => { active = false; };
  }, []);

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await applyActionCode(firebaseAuth, code);
      setState('complete');
      window.history.replaceState(null, '', window.location.pathname);
      const user = firebaseAuth.currentUser;
      if (user) { await reload(user); await user.getIdToken(true); }
    } catch {
      // La validation peut avoir réussi même si le rafraîchissement de session échoue.
      setState((current) => current === 'complete' ? current : 'invalid');
    } finally { setBusy(false); }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f3ef] px-4 py-12">
      <div className="w-full max-w-md"><AuthCard>
        {state === 'checking' ? <p role="status" className="py-10 text-center">Vérification du lien…</p> : <>
          {state === 'invalid' ? <ShieldAlert className="text-[#b8453c]" size={32} /> : <MailCheck className="text-[#367566]" size={32} />}
          <h1 className="mt-5 text-2xl font-semibold">{state === 'complete' ? 'Votre adresse est confirmée' : state === 'invalid' ? 'Ce lien n’est plus valide' : 'Bienvenue sur Mon Livret'}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{state === 'complete' ? 'Votre inscription est confirmée. Vous pouvez retrouver votre espace et préparer votre premier livret.' : state === 'invalid' ? 'Le lien a expiré ou a déjà été utilisé. Connectez-vous à votre espace pour vérifier votre adresse ou demander un nouveau lien.' : 'Confirmez votre adresse e-mail pour finaliser votre inscription.'}</p>
          {state === 'ready' ? <Button disabled={busy} onClick={() => void confirm()} className="mt-7 w-full">{busy ? 'Confirmation…' : 'Confirmer mon adresse'}</Button> : <Link href={ROUTES.LOGIN} className="mt-7 flex h-12 items-center justify-center rounded-xl bg-[#20362c] text-sm font-semibold text-white">Se connecter à mon espace</Link>}
        </>}
      </AuthCard></div>
    </main>
  );
}
