import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from './SidebarLayout';

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

  const placeholderIcon = <span className="sidebar-layout__icon-placeholder" aria-hidden />;

  const items = [
    { href: '/admin/requests', label: 'Заявки', icon: placeholderIcon },
    { href: '/admin/users', label: 'Пользователи', icon: placeholderIcon },
    { href: '/admin/content/news', label: 'Новости', icon: placeholderIcon },
    { href: '/admin/content/staff', label: 'Сотрудники', icon: placeholderIcon },
    { href: '/admin/content/services', label: 'Услуги', icon: placeholderIcon },
    { href: '/admin/analytics', label: 'Аналитика', icon: placeholderIcon },
    { href: '/admin/settings', label: 'Настройки', icon: placeholderIcon },
  ];

  return (
    <SidebarLayout items={items}>
      {children}
    </SidebarLayout>
  );
}
