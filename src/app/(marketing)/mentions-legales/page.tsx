export default function LegalPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">Mentions légales</h1>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Éditeur du site</h2>
            <p className="text-muted-foreground mb-2">
              <strong>Livret d'accueil</strong><br />
              SAS au capital de 10 000 €<br />
              12 rue des Batignolles, 75008 Paris, France<br />
              RCS Paris 123 456 789<br />
              SIRET 123 456 789 00012<br />
              TVA intracommunautaire : FR 12 123456789
            </p>
            <p className="text-muted-foreground">
              Email : contact@livret-accueil.fr<br />
              Téléphone : +33 1 23 45 67 89
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Hébergement</h2>
            <p className="text-muted-foreground">
              Ce site est hébergé par Vercel Inc., situé au 340 S Lemon Ave #4133, Walnut, CA 91789, USA.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Directeur de la publication</h2>
            <p className="text-muted-foreground">
              M. Jean Dupont, Directeur Général
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Propriété intellectuelle</h2>
            <p className="text-muted-foreground mb-4">
              L'ensemble du contenu de ce site (textes, images, vidéos, logos, icônes, etc.) est protégé par le droit d'auteur et les lois relatives à la propriété intellectuelle.
            </p>
            <p className="text-muted-foreground">
              Toute reproduction, représentation, modification, distribution ou exploitation du contenu de ce site, sous quelque forme que ce soit, sans autorisation préalable écrite, est strictement interdite.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Protection des données personnelles</h2>
            <p className="text-muted-foreground mb-4">
              Les données personnelles collectées sur ce site sont traitées conformément au Règlement Général sur la Protection des Données (RGPD) et à la politique de confidentialité de Livret d'accueil.
            </p>
            <p className="text-muted-foreground">
              Pour plus d'informations, consultez notre politique de confidentialité.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Cookies</h2>
            <p className="text-muted-foreground mb-4">
              Ce site utilise des cookies pour améliorer votre expérience de navigation, analyser le trafic et personnaliser le contenu.
            </p>
            <p className="text-muted-foreground">
              Vous pouvez configurer votre navigateur pour refuser les cookies. Cependant, certaines fonctionnalités du site pourraient ne pas fonctionner correctement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question relative aux mentions légales de ce site, vous pouvez nous contacter par email à l'adresse : legal@livret-accueil.fr
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
