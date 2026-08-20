'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import AuthCard from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Shield } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim().toLowerCase(), {
        url: `${window.location.origin}${ROUTES.LOGIN}`,
      });
      setSubmitted(true);
    } catch {
      setError('Impossible d’envoyer le lien. Vérifiez l’adresse et réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href={ROUTES.LOGIN} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} className="mr-2" />
          Retour à la connexion
        </Link>

        <AuthCard>
          {!submitted ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Mot de passe oublié ?</h2>
                <p className="text-sm text-muted-foreground">
                  Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className="h-12"
                    required
                  />
                </div>

                {error && <p role="alert" className="rounded-lg bg-danger-light p-3 text-sm text-danger">{error}</p>}
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-primary hover:bg-primary-hover text-white rounded-lg disabled:opacity-60">
                  {isSubmitting ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Vous vous souvenez de votre mot de passe ?{' '}
                  <Link href={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
                    Se connecter
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">E-mail envoyé !</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Nous avons envoyé un e-mail de réinitialisation à <span className="text-foreground font-medium">{email}</span>. Vérifiez votre boîte de réception.
              </p>
              <Link href={ROUTES.LOGIN}>
                <Button variant="outline" className="rounded-lg">
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Shield size={16} className="text-success" />
              <span>Vos données sont sécurisées</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Connexion chiffrée et conforme aux normes en vigueur.
            </p>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
