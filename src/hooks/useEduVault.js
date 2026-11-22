import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useSaved() {
  const [s, setS] = useLocalStorage('eduvault-saved', []);

  const toggleSaved = (id) => {
    if (!id) return;
    setS((x) => {
      const arr = Array.isArray(x) ? x : [];
      return arr.includes(id) ? arr.filter((y) => y !== id) : [...arr, id];
    });
  };

  const res = [s, toggleSaved];
  res.saved = s;
  res.toggle = toggleSaved;
  res.toggleSaved = toggleSaved;
  return res;
}

export function useWelcomeBack() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    const showWelcome = () => {
      if (sessionStorage.getItem('eduvault-left') === '1') {
        sessionStorage.removeItem('eduvault-left');
        setMsg('Welcome back! Pick up where you left off.');
        setTimeout(() => setMsg(''), 5000);
      }
    };
    window.addEventListener('focus', showWelcome);
    const onVisible = () => {
      if (document.visibilityState === 'visible') showWelcome();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', showWelcome);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return msg;
}

export function useRecentlyVisited() {
  const [recent, setRecent] = useLocalStorage('eduvault-recent', []);

  const addRecent = (id) => {
    if (!id) return;
    setRecent((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      return [id, ...arr.filter((x) => x !== id)].slice(0, 6);
    });
  };

  const res = [recent, addRecent];
  res.recent = recent;
  res.recentIds = recent;
  res.addRecent = addRecent;
  return res;
}
