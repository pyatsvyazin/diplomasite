import '../styles/globals.css';
import '../styles/home.css';
import '../styles/auth/common.css';
import '../styles/navigation.css';
import '../styles/admin.css';
import '../styles/admin-staff.css';
import '../styles/home/services.css';
import '../styles/home/request-form.css';
import '../styles/admin-requests.css';
import '../styles/home/hero.css';
import '../styles/sidebar-layout.css';
import '../styles/profile.css';
import '../styles/home/reviews-section.css';
import '../styles/reviews.css';
import '../styles/avatar.css';
import { AuthProvider } from '../context/AuthContext';
import Navigation from '../components/Navigation';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Navigation />
      <main className="app-main">
        <Component {...pageProps} />
      </main>
    </AuthProvider>
  );
}
