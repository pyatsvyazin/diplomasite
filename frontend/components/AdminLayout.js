import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from './SidebarLayout';
import { getAdminRequests } from '../lib/api';

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

  useEffect(() => {
    if (!loading && (!user || !isAdminOrLawyer)) {
      router.replace('/');
    }
  }, [user, loading, isAdminOrLawyer, router]);

  useEffect(() => {
    if (!user || !isAdminOrLawyer) return;
    getAdminRequests('new', 1, 1)
      .then(({ meta }) => setNewRequestsCount(Number(meta?.total) || 0))
      .catch(() => setNewRequestsCount(0));
    const id = setInterval(() => {
      getAdminRequests('new', 1, 1)
        .then(({ meta }) => setNewRequestsCount(Number(meta?.total) || 0))
        .catch(() => {});
    }, 120000);
    return () => clearInterval(id);
  }, [user, isAdminOrLawyer]);

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
