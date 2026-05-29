import HeroSection from '../components/home/HeroSection';
import ServicesSection from '../components/home/ServicesSection';
import StaffSection from '../components/home/StaffSection';
import ReviewsSection from '../components/home/ReviewsSection';
import HomeNewsSection from '../components/home/HomeNewsSection';
import RequestFormSection from '../components/home/RequestFormSection';
import HomeFooter from '../components/home/HomeFooter';

export default function HomePage() {
  return (
    <div className="home">
      <HeroSection />
      <ServicesSection />
      <StaffSection />
      <HomeNewsSection />
      <ReviewsSection />
      <RequestFormSection />
      <HomeFooter />
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