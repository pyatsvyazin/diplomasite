import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import NavNotifications from './NavNotifications';
import { getAvatarUrl } from '../lib/api';

export default function Navigation() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileWrapRef = useRef(null);
  const notificationsWrapRef = useRef(null);

  const profileOpen = openPanel === 'profile';
  const notificationsOpen = openPanel === 'notifications';

  const isAdminOrLawyer = user?.roles?.some((r) => r.name === 'admin' || r.name === 'lawyer');

  useEffect(() => {
    setServicesOpen(false);
    setOpenPanel(null);
    setMobileOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!profileOpen && !notificationsOpen) return;
    function handleClickOutside(e) {
      const inProfile = profileWrapRef.current?.contains(e.target);
      const inNotif = notificationsWrapRef.current?.contains(e.target);
      if (!inProfile && !inNotif) {
        setOpenPanel(null);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [profileOpen, notificationsOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onEsc = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link href="/" className="nav__logo" onClick={closeMobile}>
          <img src="/icons/logo.svg" alt="Щит Справедливости" className="nav__logo-img" />
        </Link>

        <nav className={`nav__menu${mobileOpen ? ' nav__menu--open' : ''}`} aria-label="Основное меню">
          <Link href="/about" className="nav__link" onClick={closeMobile}>О нас</Link>

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
                  <Link href="/services/individuals" className="nav__dropdown-link" onClick={() => { setServicesOpen(false); closeMobile(); }}>
                    Для физ. лиц
                  </Link>
                </li>
                <li>
                  <Link href="/services/business" className="nav__dropdown-link" onClick={() => { setServicesOpen(false); closeMobile(); }}>
                    Для бизнеса
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <Link href="/news" className="nav__link" onClick={closeMobile}>Новости</Link>
          <Link href="/reviews" className="nav__link" onClick={closeMobile}>Отзывы</Link>
          <Link href="/contacts" className="nav__link" onClick={closeMobile}>Контакты</Link>
        </nav>

        <div className="nav__actions">
          {loading ? (
            <span className="nav__loading">…</span>
          ) : user ? (
            <>
              <div ref={notificationsWrapRef}>
                <NavNotifications
                  open={notificationsOpen}
                  onOpenChange={(next) => setOpenPanel(next ? 'notifications' : null)}
                />
              </div>
              <div ref={profileWrapRef} className={`nav__profile-wrap ${profileOpen ? 'nav__profile-wrap--open' : ''}`}>
                <button
                  type="button"
                  className="nav__profile-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setServicesOpen(false);
                    setOpenPanel((p) => (p === 'profile' ? null : 'profile'));
                  }}
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                >
                  <Avatar name={user.full_name} size={36} className="nav__avatar" src={getAvatarUrl(user)} />
                  <span className="nav__profile-arrow nav__profile-arrow--desktop" aria-hidden>▼</span>
                </button>
                {profileOpen && (
                  <div className="nav__profile-panel">
                    <div className="nav__profile-header">
                      <Avatar name={user.full_name} size={36} className="nav__avatar" src={getAvatarUrl(user)} />
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
                          onClick={() => setOpenPanel(null)}
                        >
                          Админ-панель
                        </Link>
                      )}
                      <Link href="/profile" className="nav__profile-action" onClick={() => setOpenPanel(null)}>
                        Мой профиль
                      </Link>
                      <Link href="/settings" className="nav__profile-action" onClick={() => setOpenPanel(null)}>
                        Настройки
                      </Link>
                      <Link href="/chats" className="nav__profile-action" onClick={() => setOpenPanel(null)}>
                        Мои чаты
                      </Link>
                      <button
                        type="button"
                        className="nav__profile-action nav__profile-action--logout"
                        onClick={() => {
                          setOpenPanel(null);
                          logout();
                        }}
                      >
                        Выход
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/auth/login" className="nav__login-btn" onClick={closeMobile}>Вход</Link>
          )}

          <button
            type="button"
            className={`nav__burger${mobileOpen ? ' nav__burger--open' : ''}`}
            aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      {mobileOpen && <button type="button" className="nav__backdrop" aria-label="Закрыть меню" onClick={closeMobile} />}
    </header>
  );
}
