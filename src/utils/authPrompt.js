/**
 * Global Authentication Gate Prompt Helper
 * Triggers the global Auth Gate Modal in Shell for non-logged-in guest users.
 */
export function triggerAuthPrompt(options = {}) {
  const detail = {
    feature: options.feature || 'Account Feature',
    title: options.title || 'Sign In Required',
    message: options.message || 'Please sign in or create an account to access this feature.',
    from: options.from || (typeof window !== 'undefined' ? window.location.pathname : '/'),
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-auth-prompt', { detail }));
  }
}

export default triggerAuthPrompt;
