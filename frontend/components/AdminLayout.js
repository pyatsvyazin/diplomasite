import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from './SidebarLayout';
import { getAdminRequests } from '../lib/api';
import { useAdminRealtime } from '../hooks/useAdminRealtime';
import { ADMIN_BADGE_REFRESH_EVENT } from '../lib/adminEvents';

const ADMIN_ICONS = [
  { href: '/admin/requests', label: 'Заявки', src: '/icons/adminpanel/apply_1.svg' },
  { href: '/admin/users', label: 'Пользователи', src: '/icons/adminpanel/users_2.svg' },
  { href: '/admin/content/news', label: 'Новости', src: '/icons/adminpanel/news_3.svg' },
  { href: '/admin/content/staff', label: 'Сотрудники', src: '/icons/adminpanel/staff_4.svg' },
  { href: '/admin/content/services', label: 'Услуги', src: '/icons/adminpanel/law_5.svg' },
  { href: '/admin/analytics', label: 'Аналитика', src: '/icons/adminpanel/analytics_6.svg' },
];

function AdminNavIcon({ src, label }) {
  return (
    <img
      src={src}
      alt=""
      width={22}
      height={22}
      className="sidebar-layout__nav-img"
      aria-hidden
      title={label}
    />
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [newRequestsCount, setNewRequestsCount] = useState(0);

  const isAdminOrLawyer = user?.roles?.some((r) => r.name === 'admin' || r.name === 'lawyer');

  const refreshBadge = useCallback(() => {
    getAdminRequests('new', 1, 1)
      .then(({ meta }) => setNewRequestsCount(Number(meta?.total) || 0))
      .catch(() => setNewRequestsCount(0));
  }, []);

  useEffect(() => {
    if (!loading && (!user || !isAdminOrLawyer)) {
      router.replace('/');
    }
  }, [user, loading, isAdminOrLawyer, router]);

  useAdminRealtime({
    enabled: Boolean(user && isAdminOrLawyer),
    onPoll: refreshBadge,
  });

  useEffect(() => {
    if (!user || !isAdminOrLawyer) return undefined;

    refreshBadge();

    const onBadge = () => refreshBadge();
    window.addEventListener(ADMIN_BADGE_REFRESH_EVENT, onBadge);
    return () => window.removeEventListener(ADMIN_BADGE_REFRESH_EVENT, onBadge);
  }, [user, isAdminOrLawyer, refreshBadge]);

  if (loading || !user || !isAdminOrLawyer) {
    return (
      <div className="admin-loading">
        <p>Загрузка...</p>
      </div>
    );
  }

  const items = ADMIN_ICONS.map(({ href, label, src }) => ({
    href,
    label,
    icon: <AdminNavIcon src={src} label={label} />,
    badge: href === '/admin/requests' ? newRequestsCount : 0,
  }));

  return (
    <SidebarLayout items={items} wrapperClassName="sidebar-layout sidebar-layout--admin">
      {children}
    </SidebarLayout>
  );
}
