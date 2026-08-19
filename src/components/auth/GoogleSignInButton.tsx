'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

type GoogleSignInButtonProps = {
  className: string;
  onError: (message: string) => void;
};

export default function GoogleSignInButton({ className, onError }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    onError('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        throw error ?? new Error('Impossible de démarrer la connexion avec Google.');
      }

      window.location.assign(data.url);
    } catch {
      onError('La connexion avec Google est momentanément indisponible. Réessayez dans quelques instants.');
      setIsLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" disabled={isLoading} onClick={signInWithGoogle} className={className}>
      <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#1f2925]/10 text-xs font-bold">G</span>
      {isLoading ? 'Redirection vers Google…' : 'Continuer avec Google'}
    </Button>
  );
}
