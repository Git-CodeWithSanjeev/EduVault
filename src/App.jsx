import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { useEffect } from 'react';
import { useSaved, useRecentlyVisited, useWelcomeBack } from './hooks/useEduVault';
import { Shell, ProtectedRoute, PDFReader } from './components';
import {
  Home,
  Library,
  Categories,
  CategoryView,
  Detail,
  VideoHub,
  VideoTheater,
  Outbound,
  Form,
  SavedPage,
  Login,
  Register,
  VerifyEmailPage,
  Profile,
  ResetPassword,
  AuthCallback,
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
      window.scrollTo(0, 0);
    }
  }, [location, navType]);

  return null;
}

export default function App() {
  const [saved, toggle] = useSaved();
  const [recentIds] = useRecentlyVisited();
  const welcomeMsg = useWelcomeBack();

  return (
    <Shell welcomeMsg={welcomeMsg}>
      <ScrollRestorationManager />

      <Routes>
        {/* Public Browsing Routes */}
        <Route
          path="/"
          element={<Home saved={saved} toggle={toggle} recentIds={recentIds} />}
        />
        <Route path="/go/:id" element={<Outbound />} />
        <Route path="/read/:id" element={<PDFReader saved={saved} toggle={toggle} />} />
        <Route path="/library" element={<Library saved={saved} toggle={toggle} />} />
        <Route path="/videos" element={<VideoHub />} />
        <Route path="/video/:id" element={<VideoTheater />} />
        <Route
          path="/resource/:id"
          element={<Detail saved={saved} toggle={toggle} />}
        />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:slug" element={<CategoryView saved={saved} toggle={toggle} />} />
        
        {/* Unauthenticated Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Authenticated & Verified Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home saved={saved} toggle={toggle} recentIds={recentIds} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Home saved={saved} toggle={toggle} recentIds={recentIds} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedPage saved={saved} toggle={toggle} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Form />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        
        <Route path="/copyright" element={<Form report />} />
        <Route
          path="*"
          element={<Home saved={saved} toggle={toggle} recentIds={recentIds} />}
        />
      </Routes>
    </Shell>
  );
}
