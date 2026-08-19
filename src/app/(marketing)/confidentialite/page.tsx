export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">Politique de confidentialité</h1>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Introduction</h2>
            <p className="text-muted-foreground mb-4">
              Livret d'accueil s'engage à protéger vos données personnelles et à respecter votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos données lorsque vous utilisez notre service.
            </p>
            <p className="text-muted-foreground">
              En utilisant notre service, vous acceptez la collecte et l'utilisation de vos données conformément à cette politique.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Données collectées</h2>
            <p className="text-muted-foreground mb-4">
              Nous collectons les types de données suivants :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Données d'inscription :</strong> nom, prénom, adresse e-mail, mot de passe</li>
              <li><strong>Données de profil :</strong> nom de l'établissement, type d'activité, informations de contact</li>
              <li><strong>Données de logement :</strong> adresse, photos, descriptions, équipements</li>
              <li><strong>Données d'utilisation :</strong> statistiques de consultation, interactions avec le service</li>
              <li><strong>Données de paiement :</strong> informations de carte bancaire (traitées par notre prestataire de paiement)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Utilisation des données</h2>
            <p className="text-muted-foreground mb-4">
              Nous utilisons vos données pour :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fournir et améliorer notre service</li>
              <li>Gérer votre compte et vos abonnements</li>
              <li>Envoyer des communications relatives au service</li>
              <li>Analyser l'utilisation du service pour l'améliorer</li>
              <li>Prévenir les fraudes et assurer la sécurité</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Partage des données</h2>
            <p className="text-muted-foreground mb-4">
              Nous ne partageons vos données personnelles qu'avec :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Vos voyageurs (via les livrets d'accueil que vous créez)</li>
              <li>Nos prestataires de services (hébergement, paiement, email)</li>
              <li>Les autorités compétentes (si requis par la loi)</li>
            </ul>
            <p className="text-muted-foreground">
              Nous ne vendons pas vos données personnelles à des tiers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Sécurité des données</h2>
            <p className="text-muted-foreground mb-4">
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Chiffrement des données (HTTPS)</li>
              <li>Stockage des données en Europe</li>
              <li>Contrôle d'accès strict</li>
              <li>Surveillance continue de la sécurité</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Vos droits</h2>
            <p className="text-muted-foreground mb-4">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification de vos données</li>
              <li>Droit à l'effacement de vos données</li>
              <li>Droit à la portabilité de vos données</li>
              <li>Droit d'opposition au traitement</li>
              <li>Droit de retirer votre consentement</li>
            </ul>
            <p className="text-muted-foreground">
              Pour exercer ces droits, contactez-nous à l'adresse : dpo@livret-accueil.fr
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Conservation des données</h2>
            <p className="text-muted-foreground mb-4">
              Nous conservons vos données uniquement aussi longtemps que nécessaire pour :
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fournir notre service</li>
              <li>Respecter nos obligations légales</li>
              <li>Résoudre des litiges</li>
              <li>Prévenir des fraudes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact</h2>
            <p className="text-muted-foreground mb-4">
              Pour toute question relative à cette politique de confidentialité, contactez-nous :
            </p>
            <p className="text-muted-foreground">
              Email : dpo@livret-accueil.fr<br />
              Adresse : 12 rue des Batignolles, 75008 Paris, France
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
