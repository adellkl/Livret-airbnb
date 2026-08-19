import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Shield, Smartphone, RefreshCw } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center px-4 py-2 bg-primary-light rounded-full">
              <span className="text-sm font-medium text-primary">
                POUR HÔTES AIRBNB, CONCIERGERIES ET HÔTELS
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Le livret d&apos;accueil digital<br />
              <span className="text-primary">pour chaque hébergement.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              Créez un guide complet et sécurisé pour chaque logement. Offrez à vos voyageurs toutes les informations utiles avant, pendant et après leur séjour.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={ROUTES.REGISTER}>
                <Button size="lg" className="bg-primary hover:bg-primary-hover text-white rounded-lg w-full sm:w-auto">
                  Essayer gratuitement
                </Button>
              </Link>
              <Link href="#">
                <Button size="lg" variant="outline" className="rounded-lg border-border w-full sm:w-auto">
                  Voir une démo
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 pt-8">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary-light rounded-lg">
                  <Shield size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Lien unique et sécurisé</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary-light rounded-lg">
                  <Smartphone size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Accessible sur mobile</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary-light rounded-lg">
                  <RefreshCw size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Mise à jour instantanée</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10">
              <div className="bg-surface rounded-2xl shadow-premium-lg p-6 max-w-md mx-auto">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">L</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">L&apos;Atelier des Batignolles</p>
                    <p className="text-xs text-muted-foreground">Livret d&apos;accueil</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 bg-surface-soft rounded-full w-3/4"></div>
                  <div className="h-2 bg-surface-soft rounded-full w-1/2"></div>
                  <div className="h-2 bg-surface-soft rounded-full w-2/3"></div>
                </div>
              </div>

              <div className="absolute -bottom-8 -right-8 bg-surface rounded-xl shadow-premium p-4 max-w-xs">
                <p className="text-xs font-medium text-muted-foreground mb-2">Tableau de bord</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">12</p>
                    <p className="text-xs text-muted-foreground">Logements</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">248</p>
                    <p className="text-xs text-muted-foreground">Vues</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary">98%</p>
                    <p className="text-xs text-muted-foreground">Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
