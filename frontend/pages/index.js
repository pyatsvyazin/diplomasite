import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import HeroSection from '../components/home/HeroSection';
import ServicesSection from '../components/home/ServicesSection';
import ReviewsSection from '../components/home/ReviewsSection';
import RequestFormSection from '../components/home/RequestFormSection';

export default function HomePage() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="home">
      <HeroSection />
      <ServicesSection />
      <ReviewsSection />
      <RequestFormSection />
    </div>
  );
}

/*
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
*/