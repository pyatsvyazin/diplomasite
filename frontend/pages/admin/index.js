import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/requests');
  }, [router]);

  return null;
}
