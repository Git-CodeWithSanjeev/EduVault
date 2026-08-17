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

  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    try {
      if (!window.google?.accounts?.oauth2) {
        return reject(new Error('Google Identity Services SDK failed to load.'));
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('[Google OAuth Error]:', tokenResponse);
            if (tokenResponse.error === 'invalid_client' || tokenResponse.error_description?.includes('origin')) {
              return reject(new Error('GOOGLE_ORIGIN_BLOCKED'));
            }
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }

          try {
            // Fetch verified user profile directly from Google
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });

            if (!userInfoRes.ok) {
              return reject(new Error('Failed to fetch user profile from Google.'));
            }

            const profile = await userInfoRes.json();
            resolve({
              email: profile.email,
              name: profile.name || profile.given_name || profile.email.split('@')[0],
              avatar: profile.picture || '🎓',
              googleId: profile.sub,
              accessToken: tokenResponse.access_token,
            });
          } catch (fetchErr) {
            reject(fetchErr);
          }
        },
        error_callback: (err) => {
          console.error('[Google GIS Error Callback]:', err);
          reject(new Error('GOOGLE_ORIGIN_BLOCKED'));
        }
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Dev mode fallback profile for tzk7865@gmail.com
 */
export function getDevFallbackGoogleProfile() {
  return {
    email: 'tzk7865@gmail.com',
    name: 'TZK Student',
    avatar: '🎓',
    googleId: 'dev-google-tzk7865',
    isGoogle: true,
  };
}

