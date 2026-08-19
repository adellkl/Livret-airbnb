import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
}

export default function FeatureCard({ icon: Icon, title, description, benefits }: FeatureCardProps) {
  return (
    <div className="bg-surface rounded-xl p-6 shadow-premium hover:shadow-premium-lg transition-shadow">
      <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-4">
        <Icon size={24} className="text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <ul className="space-y-2">
        {benefits.map((benefit, index) => (
          <li key={index} className="text-xs text-muted-foreground flex items-start">
            <span className="text-primary mr-2">•</span>
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  );
}
