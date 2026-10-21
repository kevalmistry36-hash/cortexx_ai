import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cloudDatabase: 'Firebase Firestore',
    smtpReady: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
  });
});

// Helper to construct nodemailer transporter
function createSmtpTransporter(smtpConfig?: any) {
  const host = smtpConfig?.host || process.env.SMTP_HOST;
  const port = Number(smtpConfig?.port || process.env.SMTP_PORT) || 587;
  const secure = Boolean(smtpConfig?.secure ?? (port === 465));
  const user = smtpConfig?.auth?.user || smtpConfig?.user || process.env.SMTP_USER;
  const pass = smtpConfig?.auth?.pass || smtpConfig?.pass || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Incomplete SMTP configuration. Host, username/email, and password are required.');
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    }),
    sender: {
      name: smtpConfig?.fromName || process.env.SMTP_FROM_NAME || 'Cortexx AI Institute',
      email: smtpConfig?.fromEmail || user || process.env.SMTP_FROM_EMAIL || 'info.cortexx@gmail.com',
    },
  };
}

// SMTP Test Connection
app.post('/api/mail/test-smtp', async (req, res) => {
  try {
    const { smtp, recipient } = req.body;
    const { transporter, sender } = createSmtpTransporter(smtp);

    // Verify SMTP connection
    await transporter.verify();

    // If test recipient is specified, dispatch sample email
    if (recipient && typeof recipient === 'string' && recipient.includes('@')) {
      await transporter.sendMail({
        from: `"${sender.name}" <${sender.email}>`,
        to: recipient.trim(),
        subject: 'Cortexx AI Institute · SMTP Integration Verified',
        text: 'This is a test notification confirming your direct SMTP mail integration is active and operating normally.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
            <div style="border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="margin: 0; color: #059669; font-size: 20px;">SMTP Integration Verified</h2>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Cortexx AI Institute Automated Mail Dispatcher</p>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Congratulations! Your SMTP email server has authenticated successfully. Direct email dispatch for <strong>invoices, payment receipts, admission confirmations, and notifications</strong> is now operational.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 13px;">
              <div><strong>Sender:</strong> ${sender.name} &lt;${sender.email}&gt;</div>
              <div style="margin-top: 4px;"><strong>Target Test:</strong> ${recipient.trim()}</div>
              <div style="margin-top: 4px;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN')}</div>
            </div>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
              Cortexx AI Institute · +91 7984691082 · info.cortexx@gmail.com
            </p>
          </div>
        `,
      });
    }

    return res.json({
      success: true,
      message: recipient
        ? `SMTP authenticated successfully and test email delivered to ${recipient}!`
        : 'SMTP connection verified successfully! Server is ready to send emails.',
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    let userFriendlyError = errMsg;

    if (
      errMsg.includes('534') ||
      errMsg.includes('Application-specific password required') ||
      errMsg.includes('InvalidSecondFactor')
    ) {
      userFriendlyError =
        'Gmail requires a 16-character Google App Password (not your normal Google account password). Go to Google Account > Security > 2-Step Verification > App Passwords, generate an App Password, and paste it here.';
    } else if (
      errMsg.includes('535') ||
      errMsg.includes('Username and Password not accepted') ||
      errMsg.includes('Invalid login')
    ) {
      userFriendlyError =
        'SMTP Authentication Failed: Username and password not accepted. For Gmail, ensure 2-Step Verification is ON and use a 16-character App Password (not your personal account password).';
    } else if (
      errMsg.includes('ECONNREFUSED') ||
      errMsg.includes('ETIMEDOUT') ||
      errMsg.includes('ENOTFOUND')
    ) {
      userFriendlyError =
        'Cannot connect to SMTP server host. Please verify the host server name and port.';
    }

    // Use console.warn so invalid user credential tests are not logged as fatal runner errors
    console.warn(`[SMTP Test Notice] Authentication feedback: ${userFriendlyError}`);
    return res.status(400).json({
      success: false,
      error: userFriendlyError,
    });
  }
});

// Direct Mail Dispatch
app.post('/api/mail/send', async (req, res) => {
  try {
    const { smtp, to, subject, html, text, attachments } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email address ("to") and "subject" are required.',
      });
    }

    const { transporter, sender } = createSmtpTransporter(smtp);

    const mailOptions: any = {
      from: `"${sender.name}" <${sender.email}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text: text || '',
      html: html || '',
    };

    if (attachments && Array.isArray(attachments)) {
      mailOptions.attachments = attachments.map((att: any) => ({
        filename: att.filename,
        content: att.content,
        encoding: att.encoding || 'base64',
        contentType: att.contentType,
      }));
    }

    const info = await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: `Email successfully sent to ${to}!`,
      messageId: info.messageId,
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    let userFriendlyError = errMsg;

    if (
      errMsg.includes('534') ||
      errMsg.includes('Application-specific password required')
    ) {
      userFriendlyError =
        'Gmail requires a 16-character Google App Password. Please update your credentials in Settings > Mail / SMTP.';
    } else if (
      errMsg.includes('535') ||
      errMsg.includes('Username and Password not accepted')
    ) {
      userFriendlyError =
        'SMTP login failed: Invalid username or App Password. Please check Settings > Mail / SMTP.';
    }

    console.warn(`[SMTP Dispatch Notice] Send feedback: ${userFriendlyError}`);
    return res.status(400).json({
      success: false,
      error: userFriendlyError,
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cortexx Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Cortexx Server] failed to start:', err);
  process.exit(1);
});
