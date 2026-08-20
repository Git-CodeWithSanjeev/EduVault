import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { useEffect } from 'react';
import { useSaved, useRecentlyVisited, useWelcomeBack } from './hooks/useEduVault';
import { Shell, ProtectedRoute, PDFReader } from './components';
import {
  HomePage,
  LibraryPage,
  CategoriesPage,
  CategoryDetailPage,
  BookDetailPage,
  VideoHubPage,
  VideoTheaterPage,
  OutboundGatewayPage,
  ContributeReportPage,
  SavedWishlistPage,
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ProfilePage,
  ResetPasswordPage,
  AuthCallbackPage,
  AdminDashboardPage,
} from './pages';

const scrollPositionsMap = new Map();

function ScrollRestorationManager() {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scrollPositionsMap.set(location.key, window.scrollY);
        scrollPositionsMap.set(location.pathname + location.search, window.scrollY);
        try {
          sessionStorage.setItem('eduvault_pos_' + location.pathname, String(window.scrollY));
        } catch (e) {}
      }, 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location]);

  useEffect(() => {
    const savedYKey = scrollPositionsMap.get(location.key);
    const savedYPath = scrollPositionsMap.get(location.pathname + location.search);
    const sessionY = Number(sessionStorage.getItem('eduvault_pos_' + location.pathname) || '0');
    const targetY = savedYKey !== undefined ? savedYKey : (savedYPath !== undefined ? savedYPath : (navType === 'POP' ? sessionY : 0));

    if (navType === 'POP' && targetY > 0) {
      [20, 80, 180, 350].forEach((delay) => {
        setTimeout(() => {
          window.scrollTo({ top: targetY, behavior: 'instant' });
        }, delay);
      });
    } else if (navType === 'PUSH') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location, navType]);

  return null;
}

export function App() {
  const { saved, toggle } = useSaved();
  const { recentIds } = useRecentlyVisited();
  useWelcomeBack();

  return (
    <Shell saved={saved} toggle={toggle}>
      <ScrollRestorationManager />
      <Routes>
        {/* Public Browsing Routes */}
        <Route
          path="/"
          element={<HomePage saved={saved} toggle={toggle} recentIds={recentIds} />}
        />
        <Route path="/go/:id" element={<OutboundGatewayPage />} />
        <Route path="/read/:id" element={<PDFReader saved={saved} toggle={toggle} />} />
        <Route path="/library" element={<LibraryPage saved={saved} toggle={toggle} />} />
        <Route path="/videos" element={<VideoHubPage />} />
        <Route path="/video/:id" element={<VideoTheaterPage />} />
        <Route
          path="/resource/:id"
          element={<BookDetailPage saved={saved} toggle={toggle} />}
        />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/category/:slug" element={<CategoryDetailPage saved={saved} toggle={toggle} />} />
        
        {/* Unauthenticated Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Authenticated & Verified Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage saved={saved} toggle={toggle} recentIds={recentIds} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <HomePage saved={saved} toggle={toggle} recentIds={recentIds} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedWishlistPage saved={saved} toggle={toggle} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <ContributeReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={<AdminDashboardPage />} />
        
        <Route path="/copyright" element={<ContributeReportPage report />} />
        <Route
          path="*"
          element={<HomePage saved={saved} toggle={toggle} recentIds={recentIds} />}
        />
      </Routes>
    </Shell>
  );
}

export default App;
