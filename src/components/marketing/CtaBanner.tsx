import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

interface CtaBannerProps {
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaHref?: string;
}

export default function CtaBanner({ title, subtitle, ctaText, ctaHref = ROUTES.REGISTER }: CtaBannerProps) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto">
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{title}</h2>
          {subtitle && <p className="text-white/80 mb-8 max-w-2xl mx-auto">{subtitle}</p>}
          <Link href={ctaHref}>
            <Button size="lg" className="bg-white text-primary hover:bg-surface rounded-lg">
              {ctaText}
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
