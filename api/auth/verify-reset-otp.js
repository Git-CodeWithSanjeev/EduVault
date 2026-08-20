const globalOtpMap = global.resetOtpMap || (global.resetOtpMap = new Map());

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const stored = globalOtpMap.get(cleanEmail);

    if (!stored || stored.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Verification code has expired or was not requested. Please request a new code.' });
    }

    if (String(stored.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code confirmed successfully.',
    });
  } catch (err) {
    console.error('[Vercel Auth Verify Reset OTP Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to verify reset code' });
  }
}
