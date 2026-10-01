import { privateMetadata } from '@/lib/seo';
import AdminAccessGuard from '@/components/auth/AdminAccessGuard';

export const metadata = privateMetadata;

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <AdminAccessGuard>{children}</AdminAccessGuard>;
}
