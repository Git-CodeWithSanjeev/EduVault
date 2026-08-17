import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useSaved() {
  const [s, setS] = useLocalStorage('eduvault-saved', []);

  const toggleSaved = (id) => {
    setS((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  };

  return [s, toggleSaved];
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
    setRecent((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 6));
  };

  return [recent, addRecent];
}
