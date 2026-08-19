import CtaBanner from '@/components/marketing/CtaBanner';
import FeaturesScrollStory from '@/components/marketing/FeaturesScrollStory';

export default function FeaturesPage() {
  return (
    <>
      <section className="overflow-clip pt-16 md:pt-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="max-w-4xl pb-12 md:pb-20">
            <p className="section-kicker mb-5">Une expérience, de bout en bout</p>
            <h1 className="text-balance text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Tout pour mieux accueillir.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Huit fonctionnalités pensées comme un même parcours, de la création de votre livret
              jusqu&apos;au suivi de chaque séjour.
            </p>
          </div>
        </div>
        <FeaturesScrollStory />
      </section>

      <CtaBanner 
        title="Prêt à digitaliser l'accueil de vos voyageurs ?"
        subtitle="Découvrez toutes nos fonctionnalités en créant votre compte gratuit"
        ctaText="Essayer gratuitement"
      />
    </>
  );
}
