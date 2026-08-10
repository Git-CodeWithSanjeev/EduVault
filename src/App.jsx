import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { items } from './data/openItems';
import { useSaved, useRecentlyVisited, useWelcomeBack } from './hooks/useEduVault';
import { Shell } from './components/Shell';
import { PDFReader } from './components/PDFReader';
import { Cards } from './components/Cards';
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
        <Route
          path="/saved"
          element={<SavedPage saved={saved} toggle={toggle} />}
        />
        <Route path="/upload" element={<Form />} />
        <Route path="/copyright" element={<Form report />} />
        <Route
          path="*"
          element={<Home saved={saved} toggle={toggle} recentIds={recentIds} />}
        />
      </Routes>
    </Shell>
  );
}
