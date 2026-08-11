import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSaved, useRecentlyVisited, useWelcomeBack } from './hooks/useEduVault';
import { Shell } from './components/Shell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PDFReader } from './components/PDFReader';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { Categories } from './pages/Categories';
import { CategoryView } from './pages/CategoryView';
import { Detail } from './pages/Detail';
import { VideoHub } from './pages/VideoHub';
import { VideoTheater } from './pages/VideoTheater';
import { Outbound } from './pages/Outbound';
import { Form } from './pages/Form';
import { SavedPage } from './pages/SavedPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { Profile } from './pages/Profile';
import { ResetPassword } from './pages/ResetPassword';
import { AuthCallback } from './pages/AuthCallback';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [saved, toggle] = useSaved();
  const [recentIds] = useRecentlyVisited();
  const welcomeMsg = useWelcomeBack();

  return (
    <Shell welcomeMsg={welcomeMsg}>
      <ScrollToTop />
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
