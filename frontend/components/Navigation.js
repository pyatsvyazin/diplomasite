import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileWrapRef = useRef(null);

  useEffect(() => {
    setServicesOpen(false);
    setProfileOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!profileOpen) return;
    function handleClickOutside(e) {
      if (profileWrapRef.current && !profileWrapRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [profileOpen]);

  function getInitials(name) {
    if (!name || !name.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }

  const isAdminOrLawyer = user?.roles?.some((r) => r.name === 'admin' || r.name === 'lawyer');

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link href="/" className="nav__logo">
          Логотип
        </Link>

        <nav className="nav__menu">
          <Link href="/about" className="nav__link">О нас</Link>
          <Link href="/cases" className="nav__link">Все кейсы</Link>

          <div className={`nav__dropdown-wrap ${servicesOpen ? 'nav__dropdown-wrap--open' : ''}`}>
            <button
              type="button"
              className="nav__link nav__link--trigger"
              onClick={() => setServicesOpen((v) => !v)}
              aria-expanded={servicesOpen}
              aria-haspopup="true"
            >
              Услуги
              <span className="nav__dropdown-arrow" aria-hidden>▼</span>
            </button>
            {servicesOpen && (
              <ul className="nav__dropdown">
                <li>
                  <Link href="/services/individuals" className="nav__dropdown-link" onClick={() => setServicesOpen(false)}>
                    Для физ. лиц
                  </Link>
                </li>
                <li>
                  <Link href="/services/business" className="nav__dropdown-link" onClick={() => setServicesOpen(false)}>
                    Для бизнеса
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <Link href="/news" className="nav__link">Новости</Link>
          <Link href="/reviews" className="nav__link">Отзывы</Link>
          <Link href="/contacts" className="nav__link">Контакты</Link>
        </nav>

        <div className="nav__auth">
          {loading ? (
            <span className="nav__loading">Загрузка...</span>
          ) : user ? (
            <div ref={profileWrapRef} className={`nav__profile-wrap ${profileOpen ? 'nav__profile-wrap--open' : ''}`}>
              <button
                type="button"
                className="nav__profile-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setServicesOpen(false);
                  setProfileOpen((v) => !v);
                }}
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <span className="nav__avatar" aria-hidden>
                  {getInitials(user.full_name)}
                </span>
                <span className="nav__profile-arrow" aria-hidden>▼</span>
              </button>
              {profileOpen && (
                <div className="nav__profile-panel">
                  <div className="nav__profile-header">
                    <span className="nav__profile-avatar" aria-hidden>
                      {getInitials(user.full_name)}
                    </span>
                    <p className="nav__profile-name">{user.full_name}</p>
                    <p className="nav__profile-email">{user.email}</p>
                    {isAdminOrLawyer && (
                      <p className="nav__profile-badge">Доступ: Админ-панель</p>
                    )}
                  </div>
                  <div className="nav__profile-actions">
                    {isAdminOrLawyer && (
                      <Link
                        href="/admin/users"
                        className="nav__profile-action nav__profile-action--admin"
                        onClick={() => setProfileOpen(false)}
                      >
                        Админ-панель
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="nav__profile-action"
                      onClick={() => setProfileOpen(false)}
                    >
                      Мой профиль
                    </Link>
                    <Link
                      href="/settings"
                      className="nav__profile-action"
                      onClick={() => setProfileOpen(false)}
                    >
                      Настройки
                    </Link>
                    <Link
                      href="/chats"
                      className="nav__profile-action"
                      onClick={() => setProfileOpen(false)}
                    >
                      Мои чаты
                    </Link>
                    <button
                      type="button"
                      className="nav__profile-action nav__profile-action--logout"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                    >
                      Выход
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="nav__login-btn">Вход</Link>
          )}
        </div>
      </div>
    </header>
  );
}
