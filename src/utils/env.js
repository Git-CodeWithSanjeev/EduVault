/**
 * Universal Environment Variable Helper
 * Works seamlessly in both Vite and Next.js (client & server)
 */
export function getEnv(key, fallback = '') {
  // Check process.env (Next.js / Node)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key] !== undefined) return process.env[key];
    if (process.env[`NEXT_PUBLIC_${key}`] !== undefined) return process.env[`NEXT_PUBLIC_${key}`];
    if (process.env[`VITE_${key}`] !== undefined) return process.env[`VITE_${key}`];
  }
  // Check import.meta.env (Vite)
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env[key] !== undefined) return import.meta.env[key];
      if (import.meta.env[`VITE_${key}`] !== undefined) return import.meta.env[`VITE_${key}`];
    }
  } catch (_) {}

  return fallback;
}

export const isDev =
  typeof process !== 'undefined' && process.env?.NODE_ENV
    ? process.env.NODE_ENV !== 'production'
    : (typeof import.meta !== 'undefined' && import.meta.env ? !!import.meta.env.DEV : true);
