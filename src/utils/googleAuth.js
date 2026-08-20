/**
 * Direct Google Authentication Helper using Google Identity Services SDK
 */

const DEFAULT_GOOGLE_CLIENT_ID = '627819986888-a9uamfrp25u162ei4dn6a25fohhoqd2u.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

/**
 * Loads the Google Identity Services SDK script dynamically if not present
 */
export function loadGoogleScript() {
  return new Promise((resolve) => {
    if (window.google?.accounts) {
      return resolve(window.google);
    }
    const existing = document.getElementById('google-gsi-script');
    if (existing) {
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

/**
 * Trigger direct Google OAuth popup window & fetch user profile
 */
export async function triggerDirectGoogleLogin() {
  const clientId = GOOGLE_CLIENT_ID;

  if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
    throw new Error(
      'Google Client ID is missing. Please add VITE_GOOGLE_CLIENT_ID in your .env file.'
    );
  }

  const google = await loadGoogleScript();
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK failed to load or is blocked by an ad-blocker.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('focus', onFocus);
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

    // If user returns focus to main window after clicking popup and popup was closed
    const onFocus = () => {
      setTimeout(() => {
        if (!settled) {
          safeReject(new Error('Google sign-in popup was closed. Please try again.'));
        }
      }, 1500);
    };

    // Safety timeout: 45 seconds max
    const timeoutId = setTimeout(() => {
      if (!settled) {
        safeReject(new Error('Google sign-in timed out. Please try again.'));
      }
    }, 45000);

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

          try {
            // Fetch verified user profile directly from Google
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });

            if (!userInfoRes.ok) {
              return safeReject(new Error('Failed to fetch user profile from Google.'));
            }

            const profile = await userInfoRes.json();
            safeResolve({
              email: profile.email,
              name: profile.name || profile.given_name || profile.email.split('@')[0],
              avatar: profile.picture || '🎓',
              googleId: profile.sub,
              accessToken: tokenResponse.access_token,
            });
          } catch (fetchErr) {
            safeReject(fetchErr);
          }
        },
        error_callback: (err) => {
          console.error('[Google GIS Error Callback]:', err);
          safeReject(new Error('GOOGLE_ORIGIN_BLOCKED'));
        },
      });

      // Listen for window focus to catch popup closure
      window.addEventListener('focus', onFocus, { once: true });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      safeReject(err);
    }
  });
}
