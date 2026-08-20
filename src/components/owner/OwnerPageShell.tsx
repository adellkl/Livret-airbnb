'use client';

import type { ReactNode } from 'react';
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import MobileNavigation from '@/components/layout/MobileNavigation';

export default function OwnerPageShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6f3ef]">
      <OwnerSidebar />
      <MobileNavigation type="owner" />
      <div className="lg:ml-[250px]">
        <DashboardHeader title={title} subtitle={subtitle} />
        <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
