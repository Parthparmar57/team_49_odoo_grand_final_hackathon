import nodemailer from 'nodemailer';

/**
 * Brevo (Sendinblue) Transactional Email Utility
 * Clean Light-Themed Email Templates
 */

function renderCleanEmailLayout({ title, badge, contentHtml, footerNote }) {
  const currentYear = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          color: #1e293b;
          margin: 0;
          padding: 36px 16px;
          -webkit-font-smoothing: antialiased;
        }
        .email-container {
          max-width: 500px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.04);
        }
        .accent-bar {
          height: 4px;
          background: linear-gradient(90deg, #ff5e1e 0%, #ff7b47 100%);
        }
        .email-body {
          padding: 36px 32px;
        }
        .logo-wrapper {
          text-align: center;
          margin-bottom: 20px;
        }
        .brand-logo {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          text-decoration: none;
        }
        .brand-orange {
          color: #ff5e1e;
        }
        .badge-wrapper {
          text-align: center;
          margin-bottom: 16px;
        }
        .category-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #ff5e1e;
          background-color: #fff7ed;
          border: 1px solid #ffedd5;
          padding: 4px 12px;
          border-radius: 20px;
        }
        .email-heading {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 14px 0;
          text-align: center;
        }
        .email-text {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .highlight-box {
          background-color: #fff7ed;
          border: 1px solid #ffedd5;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        .box-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }
        .verification-code {
          font-size: 32px;
          font-weight: 800;
          color: #ff5e1e;
          letter-spacing: 6px;
          font-family: 'Courier New', Courier, monospace;
        }
        .credential-item {
          text-align: left;
          padding: 8px 0;
          border-bottom: 1px dashed #fed7aa;
        }
        .credential-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .cred-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 2px;
        }
        .cred-val {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          word-break: break-all;
        }
        .action-container {
          text-align: center;
          margin: 28px 0 20px 0;
        }
        .primary-btn {
          display: inline-block;
          background-color: #ff5e1e;
          color: #ffffff !important;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          padding: 12px 28px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(255, 94, 30, 0.2);
        }
        .subtext-link {
          font-size: 12px;
          color: #64748b;
          text-align: center;
          word-break: break-all;
          margin-top: 12px;
        }
        .subtext-link a {
          color: #ff5e1e;
          text-decoration: underline;
        }
        .email-footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="accent-bar"></div>
        <div class="email-body">
          <div class="logo-wrapper">
            <span class="brand-logo">PeoplePay<span class="brand-orange">360</span></span>
          </div>
          ${badge ? `<div class="badge-wrapper"><span class="category-badge">${badge}</span></div>` : ''}
          ${contentHtml}
          <div class="email-footer">
            ${footerNote ? `${footerNote}<br>` : ''}
            &copy; ${currentYear} PeoplePay360 HR & Payroll Automation. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

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

  const contentHtml = `
    <h2 class="email-heading">Reset Your Account Password</h2>
    <div class="email-text">
      Hello ${recipientName || recipientEmail},<br><br>
      We received a request to reset the password for your <strong>PeoplePay360</strong> account. Use the 6-digit verification code below or click the button to set a new password.
    </div>
    
    <div class="highlight-box">
      <div class="box-label">Your Verification Code</div>
      <div class="verification-code">${verificationCode}</div>
    </div>

    <div class="action-container">
      <a href="${resetLink}" class="primary-btn">Reset Password</a>
    </div>

    <div class="subtext-link">
      Or copy and paste this link into your browser:<br>
      <a href="${resetLink}">${resetLink}</a>
    </div>
  `;

  const htmlContent = renderCleanEmailLayout({
    title: 'Reset Your PeoplePay360 Password',
    badge: 'Security & Verification',
    contentHtml,
    footerNote: 'If you did not request a password reset, please ignore this email. This link expires in 1 hour.',
  });

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
        subject: `[PeoplePay360] Password Reset Code: ${verificationCode}`,
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
          subject: `[PeoplePay360] Password Reset Code: ${verificationCode}`,
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

  // 3. Fallback for Dev Mode
  console.log(`\n======================================================`);
  console.log(`[BREVO EMAIL SERVICE - DEV PREVIEW MODE]`);
  console.log(`To: ${recipientEmail}`);
  console.log(`Verification Code: ${verificationCode}`);
  console.log(`Reset Link: ${resetLink}`);
  console.log(`======================================================\n`);
  return { success: true, mode: 'dev', resetLink, verificationCode };
}

export async function sendAccountWelcomeEmail({ recipientEmail, recipientName, initialPassword, resetToken }) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const smtpHost = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
  const smtpUser = process.env.BREVO_SMTP_USER || 'b44daf001@smtp-brevo.com';
  const smtpPass = process.env.BREVO_SMTP_PASS || process.env.BREVO_API_KEY;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/auth/reset-password/${resetToken}`;
  const loginLink = `${frontendUrl}/auth/login`;
  const senderEmail = process.env.SENDER_EMAIL || smtpUser || 'no-reply@peoplepay360.com';
  const senderName = process.env.SENDER_NAME || 'PeoplePay360 HR & Payroll';

  const isPasswordSet = Boolean(initialPassword && initialPassword.trim().length > 0);

  const subject = isPasswordSet
    ? `[PeoplePay360] Welcome to PeoplePay360 — Login Credentials`
    : `[PeoplePay360] Welcome to PeoplePay360 — Set Your Account Password`;

  const contentHtml = isPasswordSet
    ? `
      <h2 class="email-heading">Welcome to PeoplePay360</h2>
      <div class="email-text">
        Hello ${recipientName || recipientEmail},<br><br>
        Your user account has been successfully created. Below are your login credentials to access the <strong>PeoplePay360</strong> HR & Payroll platform.
      </div>

      <div class="highlight-box">
        <div class="credential-item">
          <span class="cred-label">Username / Work Email</span>
          <span class="cred-val">${recipientEmail}</span>
        </div>
        <div class="credential-item">
          <span class="cred-label">Initial Password</span>
          <span class="cred-val" style="color: #ff5e1e;">${initialPassword}</span>
        </div>
      </div>

      <div class="email-text">
        You can log in directly using your credentials above, or use the button below to sign in.
      </div>

      <div class="action-container">
        <a href="${loginLink}" class="primary-btn">Log In to Your Account</a>
      </div>

      <div class="subtext-link">
        Reset or update your password anytime at:<br>
        <a href="${resetLink}">${resetLink}</a>
      </div>
    `
    : `
      <h2 class="email-heading">Welcome to PeoplePay360</h2>
      <div class="email-text">
        Hello ${recipientName || recipientEmail},<br><br>
        An account has been created for you on the <strong>PeoplePay360</strong> HR & Payroll Automation Platform.
      </div>

      <div class="highlight-box">
        <div class="credential-item">
          <span class="cred-label">Username / Work Email</span>
          <span class="cred-val">${recipientEmail}</span>
        </div>
      </div>

      <div class="email-text">
        Please click the button below to set your account password and activate your access.
      </div>

      <div class="action-container">
        <a href="${resetLink}" class="primary-btn">Set Account Password</a>
      </div>

      <div class="subtext-link">
        Or copy and paste this link into your browser:<br>
        <a href="${resetLink}">${resetLink}</a>
      </div>
    `;

  const htmlContent = renderCleanEmailLayout({
    title: subject,
    badge: 'Account Setup',
    contentHtml,
    footerNote: 'For security purposes, please do not share your login credentials with anyone.',
  });

  if (smtpPass && !smtpPass.includes('your-smtp-master-key-here')) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: recipientEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[WELCOME EMAIL SMTP SENT] Message ID: ${info.messageId} to ${recipientEmail}`);
      return { success: true, messageId: info.messageId, mode: 'smtp', resetLink };
    } catch (smtpErr) {
      console.warn('[WELCOME EMAIL SMTP FAILED, TRYING API]', smtpErr.message);
    }
  }

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
          subject,
          htmlContent,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`[WELCOME EMAIL API SENT] Message ID: ${data.messageId} to ${recipientEmail}`);
        return { success: true, messageId: data.messageId, mode: 'api', resetLink };
      }
    } catch (apiErr) {
      console.error('[WELCOME EMAIL API ERROR]', apiErr.message);
    }
  }

  console.log(`\n======================================================`);
  console.log(`[WELCOME EMAIL - DEV PREVIEW MODE]`);
  console.log(`To: ${recipientEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Initial Password: ${initialPassword || '[NOT SET - Set via link]'}`);
  console.log(`Set Password Link: ${resetLink}`);
  console.log(`======================================================\n`);
  return { success: true, mode: 'dev', resetLink };
}

