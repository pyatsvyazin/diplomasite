import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function NewsByTagRedirectPage() {
  const router = useRouter();
  const tag = typeof router.query.tag === 'string' ? decodeURIComponent(router.query.tag) : '';

  useEffect(() => {
    if (!router.isReady) return;
    if (!tag) return;
    router.replace({ pathname: '/news', query: { q: tag } });
  }, [router, router.isReady, tag]);

  return (
    <div className="page news-page">
      <p>Переход к материалам по тегу…</p>
    </div>
  );
}
