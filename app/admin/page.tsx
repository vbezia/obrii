import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { COOKIE, configured, validSession } from '@/lib/admin/auth';
import { AdminEditor } from '@/components/admin/editor';
import './admin.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Керування контентом',
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  return (
    <AdminEditor
      authenticated={validSession((await cookies()).get(COOKIE)?.value)}
      configured={configured()}
    />
  );
}
