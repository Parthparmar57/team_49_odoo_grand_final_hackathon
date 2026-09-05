import nodemailer from 'nodemailer';

/**
 * Brevo (Sendinblue) Transactional Email Utility
 * Supports Brevo SMTP Relay (smtp-relay.brevo.com:587) & Brevo REST API v3
 */

export async function sendPasswordResetEmail({ recipientEmail, recipientName, resetToken, verificationCode }) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const smtpHost = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
  const smtpUser = process.env.BREVO_SMTP_USER || 'b44daf001@smtp-brevo.com';
  const smtpPass = process.env.BREVO_SMTP_PASS || process.env.BREVO_API_KEY;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/auth/reset-password/${resetToken}`;
  const senderEmail = process.env.SENDER_EMAIL || smtpUser || 'no-reply@peoplepay360.com';
  const senderName = process.env.SENDER_NAME || 'PeoplePay360 Security';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your PeoplePay360 Password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 40px 20px; }
        .card { max-width: 520px; margin: 0 auto; background-color: #1e293b; border-radius: 20px; border: 1px solid #334155; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
        .header { text-align: center; margin-bottom: 28px; }
        .logo { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
        .orange { color: #ff5e1e; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; text-align: center; }
        .text { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
        .code-box { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border: 2px dashed #ff5e1e; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
        .code-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 1.5px; margin-bottom: 8px; }
        .code-num { font-size: 36px; font-weight: 900; color: #ff5e1e; letter-spacing: 8px; font-family: monospace; }
        .btn-container { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #ff5e1e 0%, #d97706 100%); color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 36px; border-radius: 50px; box-shadow: 0 6px 20px rgba(255, 94, 30, 0.4); }
        .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #334155; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">PeoplePay<span class="orange">360</span></div>
        </div>
        <div class="title">Password Reset & Email Verification</div>
        <div class="text">
          Hello ${recipientName || recipientEmail},<br><br>
          We received a request to reset your password for your <strong>PeoplePay360</strong> HR & Payroll account. Please use the 6-digit verification code below or click the button to proceed.
        </div>
        
        <div class="code-box">
          <div class="code-title">Your 6-Digit Email Verification Code</div>
          <div class="code-num">${verificationCode}</div>
        </div>

        <div class="btn-container">
          <a href="${resetLink}" class="btn">Verify & Reset Password</a>
        </div>

        <div class="text" style="font-size: 12px; color: #64748b; text-align: center;">
          Direct reset link:<br>
          <a href="${resetLink}" style="color: #ff5e1e; word-break: break-all;">${resetLink}</a>
        </div>

        <div class="footer">
          If you did not request a password reset, please ignore this email.<br>
          This verification code & link will expire in 1 hour.<br><br>
          &copy; 2026 PeoplePay360 HR & Payroll Automation.
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Try sending via Nodemailer Brevo SMTP Relay if password/key is configured
  if (smtpPass && !smtpPass.includes('your-smtp-master-key-here')) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: recipientEmail,
        subject: `[PeoplePay360] Password Reset Verification Code: ${verificationCode}`,
        html: htmlContent,
      });

      console.log(`[BREVO SMTP SENT] Message ID: ${info.messageId} to ${recipientEmail}`);
      return { success: true, messageId: info.messageId, mode: 'smtp', resetLink, verificationCode };
    } catch (smtpErr) {
      console.warn('[BREVO SMTP ATTEMPT FAILED, TRYING REST API]', smtpErr.message);
    }
  }

  // 2. Try sending via Brevo REST API v3 if API key is provided
  if (brevoApiKey && !brevoApiKey.includes('your-brevo-api-key-here')) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: recipientEmail, name: recipientName || recipientEmail }],
          subject: `[PeoplePay360] Password Reset Verification Code: ${verificationCode}`,
          htmlContent,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[BREVO API SENT] Message ID: ${data.messageId} to ${recipientEmail}`);
        return { success: true, messageId: data.messageId, mode: 'api', resetLink, verificationCode };
      } else {
        console.error('[BREVO API ERROR]', data);
      }
    } catch (apiErr) {
      console.error('[BREVO API EXCEPTION]', apiErr.message);
    }
  }

  // 3. Fallback for Dev Mode (Console logging with working link & code)
  console.log(`\n======================================================`);
  console.log(`[BREVO EMAIL SERVICE - DEV PREVIEW MODE]`);
  console.log(`To: ${recipientEmail}`);
  console.log(`Verification Code: ${verificationCode}`);
  console.log(`Reset Link: ${resetLink}`);
  console.log(`======================================================\n`);
  return { success: true, mode: 'dev', resetLink, verificationCode };
}
