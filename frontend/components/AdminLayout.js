import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [contentOpen, setContentOpen] = useState(false);

  const isAdminOrLawyer = user?.roles?.some((r) => r.name === 'admin' || r.name === 'lawyer');

  useEffect(() => {
    if (!loading && (!user || !isAdminOrLawyer)) {
      router.replace('/');
    }
  }, [user, loading, isAdminOrLawyer, router]);

  useEffect(() => {
    if (router.pathname.startsWith('/admin/content')) {
      setContentOpen(true);
    }
  }, [router.pathname]);

  if (loading || !user || !isAdminOrLawyer) {
    return (
      <div className="admin-loading">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <nav className="admin__nav">
          <Link
            href="/admin/requests"
            className={`admin__nav-link ${router.pathname.includes('/admin/requests') ? 'admin__nav-link--active' : ''}`}
          >
            Заявки
          </Link>
          <Link
            href="/admin/users"
            className={`admin__nav-link ${router.pathname.includes('/admin/users') ? 'admin__nav-link--active' : ''}`}
          >
            Все пользователи
          </Link>
          <div className="admin__nav-group">
            <button
              type="button"
              className={`admin__nav-link admin__nav-link--trigger ${contentOpen ? 'admin__nav-link--open' : ''}`}
              onClick={() => setContentOpen((v) => !v)}
            >
              Контент сайта
              <span className="admin__nav-arrow">▼</span>
            </button>
            {contentOpen && (
              <div className="admin__nav-sublinks">
                <Link href="/admin/content/news" className="admin__nav-sublink">Новости</Link>
                <Link href="/admin/content/staff" className="admin__nav-sublink">Сотрудники</Link>
                <Link href="/admin/content/services" className="admin__nav-sublink">Услуги</Link>
              </div>
            )}
          </div>
          <Link
            href="/admin/analytics"
            className={`admin__nav-link ${router.pathname.includes('/admin/analytics') ? 'admin__nav-link--active' : ''}`}
          >
            Аналитика
          </Link>
          <Link
            href="/admin/settings"
            className={`admin__nav-link ${router.pathname.includes('/admin/settings') ? 'admin__nav-link--active' : ''}`}
          >
            Системные настройки
          </Link>
        </nav>
      </aside>
      <main className="admin__content">
        {children}
      </main>
    </div>
  );
}
