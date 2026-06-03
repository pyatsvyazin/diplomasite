import '../styles/globals.css';
import '../styles/home.css';
import '../styles/auth/common.css';
import '../styles/navigation.css';
import '../styles/admin.css';
import '../styles/admin-staff.css';
import '../styles/home/services.css';
import '../styles/home/request-form.css';
import '../styles/admin-requests.css';
import '../styles/admin-posts.css';
import '../styles/admin-services.css';
import '../styles/home/hero.css';
import '../styles/home/home-news.css';
import '../styles/home/home-footer.css';
import '../styles/sidebar-layout.css';
import '../styles/profile.css';
import '../styles/home/reviews-section.css';
import '../styles/home/staff-section.css';
import '../styles/reviews.css';
import '../styles/avatar.css';
import '../styles/status-tokens.css';
import '../styles/request-chat-link.css';
import '../styles/news-cards.css';
import '../styles/post-detail.css';
import '../styles/request-chat.css';
import '../styles/meetings.css';
import '../styles/profile-dashboard.css';
import '../styles/admin-analytics.css';
import '../styles/home-mobile.css';
import '../styles/contacts-page.css';
import '../styles/about-page.css';
import '../styles/page-layout.css';
import '../styles/password-rules.css';
import { useRouter } from 'next/router';
import { AuthProvider } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import YandexMetrika from '../components/YandexMetrika';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAuthRoute = router.pathname.startsWith('/auth');

  return (
    <AuthProvider>
      <YandexMetrika />
      <Navigation />
      <main className={`app-main${isAuthRoute ? ' app-main--auth' : ''}`}>
        <Component {...pageProps} />
      </main>
    </AuthProvider>
  );
}
