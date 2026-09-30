import Image from 'next/image';

type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({ className = 'h-9 w-9' }: BrandMarkProps) {
  return (
    <Image
      src="/icon.png"
      alt="Logo Mon Livret"
      width={56}
      height={56}
      className={className}
    />
  );
}
