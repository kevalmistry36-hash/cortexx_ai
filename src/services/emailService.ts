import { Invoice, PaymentReceipt } from '../types';
import { INSTITUTE_PROFILE } from '../constants/initialData';
import { getStudents } from './storage';

export interface SmtpConfig {
  enabled: boolean;
  provider: 'gmail' | 'brevo' | 'hostinger' | 'custom';
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

const SMTP_STORAGE_KEY = 'cortexx_smtp_config_v1';

export const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  enabled: false,
  provider: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'info.cortexx@gmail.com',
  pass: '',
  fromName: 'Cortexx AI Institute',
  fromEmail: 'info.cortexx@gmail.com',
};

export function getSmtpConfig(): SmtpConfig {
  if (typeof window === 'undefined') return DEFAULT_SMTP_CONFIG;
  const raw = localStorage.getItem(SMTP_STORAGE_KEY);
  if (!raw) return DEFAULT_SMTP_CONFIG;
  try {
    return { ...DEFAULT_SMTP_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SMTP_CONFIG;
  }
}

export function saveSmtpConfig(config: SmtpConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SMTP_STORAGE_KEY, JSON.stringify(config));
}

/**
 * Test SMTP configuration via server backend
 */
export async function testSmtpConnection(
  config?: SmtpConfig,
  recipient?: string
): Promise<{ success: boolean; message: string }> {
  const activeConfig = config || getSmtpConfig();
  try {
    const res = await fetch('/api/mail/test-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smtp: {
          host: activeConfig.host.trim(),
          port: Number(activeConfig.port) || 587,
          secure: activeConfig.secure,
          auth: {
            user: activeConfig.user.trim(),
            pass: activeConfig.pass.trim(),
          },
          fromName: activeConfig.fromName.trim() || 'Cortexx AI Institute',
          fromEmail: activeConfig.fromEmail.trim() || activeConfig.user.trim(),
        },
        recipient: recipient?.trim() || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Failed to authenticate with SMTP server. Please verify settings.',
      };
    }

    return {
      success: true,
      message: data.message || 'SMTP server connection verified successfully!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error connecting to mail server.',
    };
  }
}

/**
 * Send an Official Tax Invoice via Direct SMTP
 */
export async function sendInvoiceEmail(
  invoice: Invoice,
  recipientEmail?: string,
  customNote?: string
): Promise<{ success: boolean; message: string }> {
  const config = getSmtpConfig();
  const targetEmail = (recipientEmail || invoice.studentEmail || '').trim();

  if (!targetEmail) {
    return { success: false, message: 'Student has no valid email address recorded.' };
  }

  const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const subject = `Tax Invoice ${invoice.invoiceNumber} · Cortexx AI Institute`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
      <div style="max-width: 620px; margin: 30px auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #09090b 0%, #18181b 100%); padding: 32px 30px; color: #ffffff; border-bottom: 3px solid #10b981;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;">${INSTITUTE_PROFILE.name.toUpperCase()}</h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #a1a1aa; font-style: italic;">"${INSTITUTE_PROFILE.tagline}"</p>
            </div>
            <div style="text-align: right; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 6px 14px; display: inline-block;">
              <span style="font-size: 11px; font-weight: 700; color: #34d399; letter-spacing: 1px; text-transform: uppercase;">TAX INVOICE</span>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          <p style="margin: 0 0 16px; font-size: 15px; color: #334155;">
            Dear <strong>${invoice.studentName}</strong>,
          </p>
          <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
            Thank you for enrolling with <strong>Cortexx AI Institute</strong>. Below is your official itemized Tax Invoice for course registration and training fees.
          </p>

          ${customNote ? `<div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0; font-size: 13px; color: #713f12;">${customNote}</div>` : ''}

          <!-- Invoice Metadata Cards -->
          <div style="display: table; width: 100%; margin-bottom: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
            <div style="display: table-row;">
              <div style="display: table-cell; width: 50%; padding-bottom: 10px;">
                <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Invoice Number</span>
                <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px;">${invoice.invoiceNumber}</div>
              </div>
              <div style="display: table-cell; width: 50%; padding-bottom: 10px;">
                <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Issue Date</span>
                <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px;">${invoice.invoiceDate}</div>
              </div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; width: 50%;">
                <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Course Enrolled</span>
                <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px;">${invoice.courseName}</div>
              </div>
              <div style="display: table-cell; width: 50%;">
                <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Payment Status</span>
                <div style="font-size: 14px; font-weight: 700; color: ${invoice.remainingBalance === 0 ? '#059669' : '#d97706'}; margin-top: 2px;">
                  ${invoice.remainingBalance === 0 ? 'PAID IN FULL' : `PARTIAL / DUE (${inr(invoice.remainingBalance)})`}
                </div>
              </div>
            </div>
          </div>

          <!-- Financial Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff; text-align: left;">
                <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; border-top-left-radius: 8px;">DESCRIPTION</th>
                <th style="padding: 10px 14px; font-size: 12px; font-weight: 700; text-align: right; border-top-right-radius: 8px;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 14px; font-size: 13px; color: #334155;">Base Course Fee</td>
                <td style="padding: 12px 14px; font-size: 13px; text-align: right; font-weight: 600;">${inr(invoice.courseFee)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 14px; font-size: 13px; color: #334155;">Promotional Discount</td>
                <td style="padding: 12px 14px; font-size: 13px; text-align: right; color: #dc2626; font-weight: 600;">- ${inr(invoice.discount)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
                <td style="padding: 12px 14px; font-size: 13px; font-weight: 700; color: #0f172a;">Net Agreed Fee</td>
                <td style="padding: 12px 14px; font-size: 14px; text-align: right; font-weight: 700; color: #0f172a;">${inr(invoice.totalPayable)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 14px; font-size: 13px; color: #059669; font-weight: 600;">Total Paid to Date</td>
                <td style="padding: 12px 14px; font-size: 13px; text-align: right; color: #059669; font-weight: 700;">${inr(invoice.amountPaid)}</td>
              </tr>
              <tr style="background-color: #f0fdf4;">
                <td style="padding: 14px; font-size: 14px; font-weight: 800; color: #064e3b;">Remaining Balance</td>
                <td style="padding: 14px; font-size: 15px; text-align: right; font-weight: 800; color: ${invoice.remainingBalance === 0 ? '#059669' : '#b45309'};">
                  ${inr(invoice.remainingBalance)}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Payment Details Box -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 12px; line-height: 1.6; color: #475569;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;">Official Institute Payment Details:</div>
            <div><strong>UPI VPA ID:</strong> ${INSTITUTE_PROFILE.upiId}</div>
            <div><strong>Phone / Contact:</strong> +91 ${INSTITUTE_PROFILE.phone}</div>
            <div><strong>Official Email:</strong> ${INSTITUTE_PROFILE.email}</div>
          </div>

          <p style="margin: 0; font-size: 13px; color: #64748b;">
            For any queries regarding this invoice, please reach us directly at <a href="mailto:${INSTITUTE_PROFILE.email}" style="color: #2563eb; text-decoration: none;">${INSTITUTE_PROFILE.email}</a> or call <strong>+91 ${INSTITUTE_PROFILE.phone}</strong>.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #09090b; padding: 20px 30px; text-align: center; color: #71717a; font-size: 11px; border-top: 1px solid #27272a;">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${INSTITUTE_PROFILE.name}. All Rights Reserved.</p>
          <p style="margin: 4px 0 0;">${INSTITUTE_PROFILE.address} · Website: <a href="${INSTITUTE_PROFILE.website}" style="color: #10b981; text-decoration: none;">${INSTITUTE_PROFILE.website}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const res = await fetch('/api/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smtp: {
          host: config.host.trim(),
          port: Number(config.port) || 587,
          secure: config.secure,
          auth: {
            user: config.user.trim(),
            pass: config.pass.trim(),
          },
          fromName: config.fromName.trim() || 'Cortexx AI Institute',
          fromEmail: config.fromEmail.trim() || config.user.trim(),
        },
        to: targetEmail,
        subject,
        html,
        text: `Tax Invoice ${invoice.invoiceNumber} for ${invoice.studentName}. Enrolled in ${invoice.courseName}. Agreed Fee: INR ${invoice.totalPayable}, Amount Paid: INR ${invoice.amountPaid}, Balance: INR ${invoice.remainingBalance}.`,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Failed to dispatch email via SMTP. Please check your SMTP credentials in Settings.',
      };
    }

    return {
      success: true,
      message: `Invoice ${invoice.invoiceNumber} successfully emailed to ${targetEmail}!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error occurred while sending email.',
    };
  }
}

/**
 * Send an Official Payment Receipt via Direct SMTP
 */
export async function sendReceiptEmail(
  receipt: PaymentReceipt,
  recipientEmail?: string,
  customNote?: string
): Promise<{ success: boolean; message: string }> {
  const config = getSmtpConfig();
  let targetEmail = (recipientEmail || receipt.studentEmail || '').trim();

  if (!targetEmail) {
    const students = getStudents();
    const st = students.find(s => s.id === receipt.studentId || s.name === receipt.studentName);
    if (st && st.email) {
      targetEmail = st.email.trim();
    }
  }

  if (!targetEmail) {
    return { success: false, message: 'Student has no valid email address recorded.' };
  }

  const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const subject = `Payment Receipt ${receipt.receiptNumber} · Cortexx AI Institute`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
      <div style="max-width: 620px; margin: 30px auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #09090b 0%, #18181b 100%); padding: 32px 30px; color: #ffffff; border-bottom: 3px solid #10b981;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;">${INSTITUTE_PROFILE.name.toUpperCase()}</h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #a1a1aa; font-style: italic;">"${INSTITUTE_PROFILE.tagline}"</p>
            </div>
            <div style="text-align: right; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 6px 14px; display: inline-block;">
              <span style="font-size: 11px; font-weight: 700; color: #34d399; letter-spacing: 1px; text-transform: uppercase;">PAYMENT RECEIPT</span>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #dcfce7; border: 1px solid #86efac; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px; color: #15803d;">
              ✓
            </div>
            <h2 style="margin: 12px 0 4px; font-size: 20px; color: #0f172a; font-weight: 800;">Payment Received Successfully</h2>
            <p style="margin: 0; font-size: 14px; color: #64748b;">Receipt Number: <strong>${receipt.receiptNumber}</strong></p>
          </div>

          <p style="margin: 0 0 16px; font-size: 15px; color: #334155;">
            Dear <strong>${receipt.studentName}</strong>,
          </p>
          <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
            This voucher confirms that we have successfully received your course installment payment of <strong>${inr(receipt.amountReceived)}</strong>.
          </p>

          ${customNote ? `<div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0; font-size: 13px; color: #713f12;">${customNote}</div>` : ''}

          <!-- Receipt Details Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b;">Amount Received:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 800; font-size: 16px; color: #059669;">${inr(receipt.amountReceived)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b;">Payment Date:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #0f172a;">${receipt.paymentDate}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b;">Payment Mode:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0f172a; text-transform: uppercase;">${receipt.paymentMethod}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b;">Transaction / Ref ID:</td>
                <td style="padding: 10px 0; text-align: right; font-mono; font-weight: 600; color: #0f172a;">${receipt.transactionRef || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b;">Course:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #0f172a;">${receipt.courseName || 'Practical AI Training'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 0; color: #64748b;">Related Invoice:</td>
                <td style="padding: 10px 0; text-align: right; font-mono; font-weight: 600; color: #0f172a;">${receipt.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0 0; color: #0f172a; font-weight: 700;">Remaining Balance:</td>
                <td style="padding: 12px 0 0; text-align: right; font-weight: 800; font-size: 15px; color: ${receipt.remainingBalanceAfter === 0 ? '#059669' : '#d97706'};">
                  ${inr(receipt.remainingBalanceAfter)} ${receipt.remainingBalanceAfter === 0 ? '(CLEARED)' : ''}
                </td>
              </tr>
            </table>
          </div>

          <p style="margin: 0; font-size: 13px; color: #64748b;">
            This is an automated computer-generated receipt from <strong>Cortexx AI Institute</strong>. No physical signature is required.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #09090b; padding: 20px 30px; text-align: center; color: #71717a; font-size: 11px; border-top: 1px solid #27272a;">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${INSTITUTE_PROFILE.name}. All Rights Reserved.</p>
          <p style="margin: 4px 0 0;">${INSTITUTE_PROFILE.address} · Website: <a href="${INSTITUTE_PROFILE.website}" style="color: #10b981; text-decoration: none;">${INSTITUTE_PROFILE.website}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const res = await fetch('/api/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smtp: {
          host: config.host.trim(),
          port: Number(config.port) || 587,
          secure: config.secure,
          auth: {
            user: config.user.trim(),
            pass: config.pass.trim(),
          },
          fromName: config.fromName.trim() || 'Cortexx AI Institute',
          fromEmail: config.fromEmail.trim() || config.user.trim(),
        },
        to: targetEmail,
        subject,
        html,
        text: `Payment Receipt ${receipt.receiptNumber} for ${receipt.studentName}. Received INR ${receipt.amountReceived} via ${receipt.paymentMethod} on ${receipt.paymentDate}. Remaining Balance: INR ${receipt.remainingBalanceAfter}.`,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Failed to dispatch email via SMTP. Please check your SMTP credentials in Settings.',
      };
    }

    return {
      success: true,
      message: `Receipt ${receipt.receiptNumber} successfully emailed to ${targetEmail}!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error occurred while sending email.',
    };
  }
}
