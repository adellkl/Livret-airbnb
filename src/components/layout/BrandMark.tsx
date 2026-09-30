import Image from 'next/image';
import logo from '@/app/icon.png';

type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({ className = 'h-9 w-9' }: BrandMarkProps) {
  return (
    <Image
      src={logo}
      alt="Logo Mon Livret"
      width={56}
      height={56}
      unoptimized
      loading="eager"
      className={className}
    />
  );
}
