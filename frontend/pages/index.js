import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="home">
      <h1 className="home__title">Добро пожаловать!</h1>
      <p className="home__text">Это главная страница вашего приложения.</p>
      <div className="home__nav">
        {loading ? (
          <span>Загрузка...</span>
        ) : user ? (
          <>
            <span className="home__user">Вы вошли как {user.full_name}</span>
            <button type="button" className="home__logout" onClick={logout}>
              Выход
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="home__link">Вход</Link>
            <span className="home__separator">·</span>
            <Link href="/auth/register" className="home__link">Регистрация</Link>
          </>
        )}
      </div>
    </div>
  );
}
