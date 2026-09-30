import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata;

import type { ReactNode } from 'react';

import OwnerDataPreloader from '@/components/owner/OwnerDataPreloader';

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <OwnerDataPreloader />
      {children}
    </>
  );
}
