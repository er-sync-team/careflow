import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { AdminApp } from '@/components/admin/admin-app';

export const metadata = { title: 'Facility Dashboard | CareFlow' };

export default function AdminPage({ searchParams }: { searchParams: { facility?: string } }) {
  const facility = typeof searchParams.facility === 'string' && /^H\d{2}$/.test(searchParams.facility) ? searchParams.facility : undefined;
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <AdminApp facilityHint={facility} />
      </main>
      <SiteFooter />
    </div>
  );
}
