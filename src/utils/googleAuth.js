import { getEnv } from './env';

/**
 * Direct Google Authentication Helper using Google Identity Services SDK
 */

const DEFAULT_GOOGLE_CLIENT_ID = '627819986888-a9uamfrp25u162ei4dn6a25fohhoqd2u.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID', DEFAULT_GOOGLE_CLIENT_ID);

/**
 * Loads the Google Identity Services SDK script dynamically if not present
 */
export function loadGoogleScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);

    if (window.google?.accounts?.oauth2) {
      return resolve(window.google);
    }
    const existing = document.getElementById('google-gsi-script');
    if (existing) {
      if (window.google?.accounts?.oauth2) return resolve(window.google);
      existing.addEventListener('load', () => resolve(window.google));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

// Automatically preload Google SDK as soon as possible in browser environment
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    loadGoogleScript();
  } else {
    window.addEventListener('load', () => loadGoogleScript(), { once: true });
  }
}

/**
 * Trigger direct Google OAuth popup window & fetch user profile
 * @param {Function} [onStageChange] Optional callback for tracking stage ('opening' | 'fetching' | 'signing_in')
 */
export async function triggerDirectGoogleLogin(onStageChange) {
  const clientId = GOOGLE_CLIENT_ID;

  if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
    throw new Error(
      'Google Client ID is missing. Please add GOOGLE_CLIENT_ID in your .env file.'
    );
  }

  if (typeof onStageChange === 'function') onStageChange('opening');
  const google = await loadGoogleScript();
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK failed to load. Please check your connection or ad-blocker.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      clearTimeout(timeoutId);
    };

    const safeResolve = (val) => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(val);
      }
    };

    const safeReject = (err) => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(err);
      }
    };

    // Safety timeout: 60 seconds max
    const timeoutId = setTimeout(() => {
      if (!settled) {
        safeReject(new Error('Google sign-in timed out. Please try again.'));
      }
    }, 60000);

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('[Google OAuth Error]:', tokenResponse);
            if (
              tokenResponse.error === 'invalid_client' ||
              tokenResponse.error === 'origin_mismatch' ||
              tokenResponse.error_description?.includes('origin')
            ) {
              return safeReject(new Error('GOOGLE_ORIGIN_BLOCKED'));
            }
            return safeReject(new Error(tokenResponse.error_description || tokenResponse.error));
          }

          if (typeof onStageChange === 'function') onStageChange('fetching');

          try {
            // Fetch verified user profile directly from Google with 6s timeout
            const controller = new AbortController();
            const fetchTimeout = setTimeout(() => controller.abort(), 6000);

            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
              signal: controller.signal,
            }).finally(() => clearTimeout(fetchTimeout));

            if (!userInfoRes.ok) {
              return safeReject(new Error('Failed to fetch user profile from Google.'));
            }

            const profile = await userInfoRes.json();
            if (typeof onStageChange === 'function') onStageChange('signing_in');

            safeResolve({
              email: profile.email,
              name: profile.name || profile.given_name || profile.email.split('@')[0],
              avatar: profile.picture || '🎓',
              googleId: profile.sub,
              accessToken: tokenResponse.access_token,
            });
          } catch (fetchErr) {
            if (fetchErr.name === 'AbortError') {
              safeReject(new Error('Network to Google userinfo timed out. Please try again.'));
            } else {
              safeReject(fetchErr);
            }
          }
        },
        error_callback: (err) => {
          console.error('[Google GIS Error Callback]:', err);
          if (err?.type === 'popup_closed' || err?.message?.includes('closed')) {
            safeReject(new Error('popup_closed'));
          } else {
            safeReject(new Error('GOOGLE_ORIGIN_BLOCKED'));
          }
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      safeReject(err);
    }
  });
}
