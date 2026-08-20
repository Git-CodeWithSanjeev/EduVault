import nodemailer from 'nodemailer';
import fs from 'fs';

// Helper to load .env variables if not already in process.env
function loadEnv() {
  if (fs.existsSync('.env')) {
    try {
      const envContent = fs.readFileSync('.env', 'utf-8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...vals] = trimmed.split('=');
          process.env[key.trim()] = vals.join('=').trim();
        }
      }
    } catch (e) {}
  }
}

loadEnv();

let cachedTransporter = null;
let lastConfigHash = '';

/**
 * Creates and returns the nodemailer transporter configured from environment variables.
 */
export function createEmailTransporter() {
  loadEnv();

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '';
  const pass = rawPass.replace(/\s+/g, '').trim();

  if (!user || !pass) {
    return null;
  }

  const currentConfigHash = `${host}:${port}:${user}:${pass}`;
  if (cachedTransporter && lastConfigHash === currentConfigHash) {
    return cachedTransporter;
  }

  lastConfigHash = currentConfigHash;

  if (host.includes('gmail.com')) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      auth: { user, pass },
    });
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    pool: true,
    auth: { user, pass },
  });

  return cachedTransporter;
}

/**
 * Sends a password recovery email containing the 6-digit OTP code without image attachments.
 */
export async function sendPasswordResetEmail(toEmail, otp) {
  const transporter = createEmailTransporter();
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || `"EduVault Security" <no-reply@eduvault.io>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EduVault Password Reset</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 28px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          
          <!-- Clean Brand Typography Header -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1;">
              Edu<span style="color: #0d9488;">Vault</span>
            </span>
          </div>
          
          <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; text-align: center;">
            Password Recovery Code
          </h2>
          
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center;">
            We received a request to reset your password for your EduVault account (<strong>${toEmail}</strong>).
            Enter the 6-digit verification code below to set a new password:
          </p>
          
          <div style="background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: Consolas, 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0d9488; display: inline-block;">
              ${otp}
            </span>
          </div>
          
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 24px; text-align: center;">
            ⏳ This code is valid for <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email — your password will remain unchanged.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
            &copy; ${new Date().getFullYear()} EduVault · Smart Educational Resource Hub
          </p>
        </div>
      </body>
    </html>
  `;

  if (!transporter) {
    console.warn(`\n⚠️  [Email Notice] SMTP not configured in .env (add SMTP_USER and SMTP_PASS).`);
    console.log(`🔑 [Password Reset OTP for ${toEmail}]: ${otp}\n`);
    return { sent: false, reason: 'NO_SMTP_CONFIG' };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Your EduVault Password Recovery Code: ${otp}`,
      text: `Your EduVault password reset code is: ${otp}. It will expire in 10 minutes.`,
      html,
    });

    console.log(`✉️ [Email Sent] Recovery code successfully delivered to ${toEmail} (ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [Email Error] Failed to send email to ${toEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
}

/**
 * Sends an email verification code for new user registration without image attachments.
 */
export async function sendSignupOtpEmail(toEmail, otp, name = '') {
  const transporter = createEmailTransporter();
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || `"EduVault Security" <no-reply@eduvault.io>`;
  const displayName = name ? name.split(' ')[0] : 'there';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your EduVault Account</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 28px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          
          <!-- Clean Brand Typography Header -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1;">
              Edu<span style="color: #0d9488;">Vault</span>
            </span>
          </div>
          
          <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; text-align: center;">
            Welcome to EduVault!
          </h2>
          
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center;">
            Hi <strong>${displayName}</strong>, thank you for joining EduVault. Please verify your email address (<strong>${toEmail}</strong>) with the 6-digit confirmation code below:
          </p>
          
          <div style="background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: Consolas, 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0d9488; display: inline-block;">
              ${otp}
            </span>
          </div>
          
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 24px; text-align: center;">
            ⏳ This code is valid for <strong>10 minutes</strong>. If you did not create an account on EduVault, please disregard this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
            &copy; ${new Date().getFullYear()} EduVault · Smart Educational Resource Hub
          </p>
        </div>
      </body>
    </html>
  `;

  if (!transporter) {
    console.warn(`\n⚠️  [Email Notice] SMTP not configured in .env (add SMTP_USER and SMTP_PASS).`);
    console.log(`🔑 [Signup Verification OTP for ${toEmail}]: ${otp}\n`);
    return { sent: false, reason: 'NO_SMTP_CONFIG' };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Your EduVault Verification Code: ${otp}`,
      text: `Welcome to EduVault! Your 6-digit email verification code is: ${otp}. It will expire in 10 minutes.`,
      html,
    });

    console.log(`✉️ [Email Sent] Signup OTP successfully delivered to ${toEmail} (ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [Email Error] Failed to send signup OTP to ${toEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
}
