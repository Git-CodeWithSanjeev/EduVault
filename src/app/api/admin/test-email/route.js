import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { createEmailTransporter } from '@/lib/email';

export async function POST(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const { toEmail, from } = body || {};
  const targetEmail = (toEmail || process.env.SMTP_USER || '').trim();

  if (!targetEmail) {
    return NextResponse.json({ success: false, error: 'Destination test email is required' }, { status: 200 });
  }

  const startTime = Date.now();
  try {
    const transporter = createEmailTransporter();
    if (!transporter) {
      return NextResponse.json({ success: false, error: 'SMTP is not configured. Please set SMTP_USER and SMTP_PASS first.' }, { status: 200 });
    }

    await transporter.verify();

    const info = await transporter.sendMail({
      from: from || process.env.EMAIL_FROM || `"EduVault Admin" <${process.env.SMTP_USER}>`,
      to: targetEmail,
      subject: `🧪 EduVault Admin SMTP Diagnostic Test (${new Date().toLocaleTimeString()})`,
      text: `This is a live test email sent from your EduVault Admin Panel.\n\nTimestamp: ${new Date().toISOString()}\nStatus: Operational ✅`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; background: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <h2 style="color: #0d9488; margin-top: 0;">🧪 EduVault SMTP Diagnostic Test</h2>
          <p style="color: #334155; font-size: 15px;">Your email configuration is working perfectly! All authentication and TLS handshakes were successful.</p>
          <div style="background: #ffffff; padding: 14px; border-radius: 8px; border-left: 4px solid #0d9488; font-size: 13px; color: #64748b;">
            <strong>Target:</strong> ${targetEmail}<br/>
            <strong>Timestamp:</strong> ${new Date().toLocaleString()}<br/>
            <strong>Latency:</strong> ${Date.now() - startTime}ms
          </div>
        </div>
      `,
    });

    const duration = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      latencyMs: duration,
      messageId: info.messageId,
      message: `Test email delivered successfully to ${targetEmail} in ${duration}ms!`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'SMTP test failed',
        latencyMs: Date.now() - startTime,
      },
      { status: 200 }
    );
  }
}
