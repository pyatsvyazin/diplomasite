import { useRouter } from 'next/router';

const TABS = [
  { id: 'requests', label: 'Мои заявки' },
  { id: 'consultations', label: 'Консультации' },
  { id: 'settings', label: 'Настройки' },
];

export default function ProfileDashboardLayout({ activeTab, children }) {
  const router = useRouter();

  const setTab = (id) => {
    router.push({ pathname: '/profile/profilePage', query: { tab: id } }, undefined, { shallow: true });
  };

  return (
    <div className="profile-dashboard">
      <aside className="profile-dashboard__sidebar">
        <nav className="profile-dashboard__nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`profile-dashboard__nav-btn${activeTab === t.id ? ' profile-dashboard__nav-btn--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="profile-dashboard__content">{children}</div>
    </div>
  );
}
