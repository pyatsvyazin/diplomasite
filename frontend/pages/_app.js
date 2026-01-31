import '../styles/globals.css';
import '../styles/home.css';
import '../styles/auth/common.css';
import '../styles/navigation.css';
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
