import { useState, useEffect } from 'react';

export function useSaved() {
  const [s, setS] = useState(() =>
    JSON.parse(localStorage.getItem('eduvault-saved') || '[]'),
  );
  useEffect(
    () => localStorage.setItem('eduvault-saved', JSON.stringify(s)),
    [s],
  );
  return [s, (id) => setS((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]))];
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
  const [recent, setRecent] = useState(() =>
    JSON.parse(localStorage.getItem('eduvault-recent') || '[]'),
  );

  const addRecent = (id) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 6);
      localStorage.setItem('eduvault-recent', JSON.stringify(next));
      return next;
    });
  };

  return [recent, addRecent];
}
