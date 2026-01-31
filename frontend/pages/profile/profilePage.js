import { useAuth } from '../../context/AuthContext';

function getInitials(name) {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
}

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page">
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <p>Войдите в аккаунт, чтобы просмотреть профиль.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Профиль</h1>
      <div className="profile-card">
        <span className="profile-card__avatar" aria-hidden>
          {getInitials(user.full_name)}
        </span>
        <div>
          <p><strong>ФИО:</strong> {user.full_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          {user.phone && <p><strong>Телефон:</strong> {user.phone}</p>}
          {user.roles?.length > 0 && (
            <p><strong>Роль:</strong> {user.roles.map((r) => r.name).join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
