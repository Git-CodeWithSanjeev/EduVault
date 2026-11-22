import loginHandler from '../_auth/login.js';
import registerHandler from '../_auth/register.js';
import googleHandler from '../_auth/google.js';
import forgotPasswordHandler from '../_auth/forgot-password.js';
import verifyResetOtpHandler from '../_auth/verify-reset-otp.js';
import resetPasswordHandler from '../_auth/reset-password.js';
import verifySignupOtpHandler from '../_auth/verify-signup-otp.js';
import resendSignupOtpHandler from '../_auth/resend-signup-otp.js';
import updateProfileHandler from '../_auth/update-profile.js';
import updatePasswordHandler from '../_auth/update-password.js';

const handlers = {
  login: loginHandler,
  register: registerHandler,
  google: googleHandler,
  'forgot-password': forgotPasswordHandler,
  'verify-reset-otp': verifyResetOtpHandler,
  'reset-password': resetPasswordHandler,
  'verify-signup-otp': verifySignupOtpHandler,
  'resend-signup-otp': resendSignupOtpHandler,
  'update-profile': updateProfileHandler,
  'update-password': updatePasswordHandler,
};

export default async function handler(req, res) {
  // CORS Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract action from query or url
  let action = req.query?.action;
  if (Array.isArray(action)) action = action[0];
  if (!action && req.url) {
    const cleanUrl = req.url.split('?')[0].replace(/\/$/, '');
    action = cleanUrl.split('/').pop();
  }

  const routeHandler = handlers[action];
  if (!routeHandler) {
    return res.status(404).json({
      error: `Auth endpoint '${action || 'unknown'}' not found`,
      availableEndpoints: Object.keys(handlers),
    });
  }

  return routeHandler(req, res);
}
