'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageSpinner } from '@/components/Spinner';

// The Connection & config page is hidden from the admin. Anyone hitting the URL
// directly is sent to the dashboard.
export default function ConfigPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);
  return <FullPageSpinner />;
}
