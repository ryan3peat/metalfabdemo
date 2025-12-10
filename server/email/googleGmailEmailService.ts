import { google } from 'googleapis';
import type { EmailRecipient, RFQEmailData } from './emailService';
import { createRFQEmailTemplate } from './emailService';
import type { MagicLinkEmailData } from './magicLinkEmail';
import { createMagicLinkEmailTemplate } from './magicLinkEmail';
import type { DocumentRequestEmailData } from './documentRequestEmail';
import { createDocumentRequestEmailTemplate } from './documentRequestEmail';
import type { PasswordSetupEmailData } from './passwordSetupEmail';
import { createPasswordSetupEmailTemplate } from './passwordSetupEmail';
import type { PasswordResetEmailData } from './passwordResetEmail';
import { createPasswordResetEmailTemplate } from './passwordResetEmail';
import type { DocumentUploadNotificationData } from './documentUploadNotificationEmail';
import { createDocumentUploadNotificationTemplate } from './documentUploadNotificationEmail';

export interface ContactEmailData {
  name: string;
  position: string;
  email: string;
  countryCode: string;
  mobileNumber: string;
  otherInfo?: string;
  timestamp: string;
}

export class GoogleGmailEmailService {
  private gmail: ReturnType<typeof google.gmail>;
  private senderEmail: string;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    this.senderEmail = process.env.SENDER_EMAIL || '';

    if (!clientId || !clientSecret || !refreshToken || !this.senderEmail) {
      throw new Error(
        'Missing required Google credentials. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and SENDER_EMAIL environment variables.'
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'urn:ietf:wg:oauth:2.0:oob' // Redirect URI (not used for refresh token flow)
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async sendContactEmail(
    contactData: ContactEmailData,
    recipientEmail: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const htmlContent = this.createContactEmailTemplate(contactData);

      const message = this.createMessage({
        to: recipientEmail,
        subject: `Contact Form Submission - ${contactData.name}`,
        html: htmlContent,
      });

      console.log(`\n📧 Sending contact email via Gmail API`);
      console.log(`To: ${recipientEmail}`);
      console.log(`From: ${this.senderEmail}`);
      console.log(`Subject: Contact Form Submission - ${contactData.name}`);

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      console.log(`✅ Email sent successfully to ${recipientEmail}`);
      console.log(`   Message ID: ${response.data.id}`);

      return {
        success: true,
        messageId: response.data.id || `gmail-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
    } catch (error) {
      console.error('❌ Error sending email via Gmail API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendRFQNotification(
    recipient: EmailRecipient,
    rfqData: RFQEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const htmlContent = createRFQEmailTemplate(rfqData, recipient.name);

      const message = this.createMessage({
        to: recipient.email,
        toName: recipient.name,
        subject: `Request for Quote - ${rfqData.requestNumber}`,
        html: htmlContent,
      });

      console.log(`\n📧 Sending RFQ email via Gmail API`);
      console.log(`To: ${recipient.name} <${recipient.email}>`);
      console.log(`From: ${this.senderEmail}`);
      console.log(`Subject: Request for Quote - ${rfqData.requestNumber}`);

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      console.log(`✅ Email sent successfully to ${recipient.email}`);
      console.log(`   Message ID: ${response.data.id}`);

      return {
        success: true,
        messageId: response.data.id || `gmail-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
    } catch (error) {
      console.error('❌ Error sending email via Gmail API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendBulkRFQNotifications(
    recipients: EmailRecipient[],
    rfqData: RFQEmailData[]
  ): Promise<{ sent: number; failed: number; results: any[] }> {
    const results = [];
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const data = rfqData[i];

      const result = await this.sendRFQNotification(recipient, data);

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      results.push({
        recipient: recipient.email,
        supplierId: recipient.supplierId,
        ...result,
      });
    }

    console.log(`\n📊 Bulk Email Summary: ${sent} sent, ${failed} failed\n`);

    return { sent, failed, results };
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const message = this.createMessage({
        to,
        subject,
        html,
      });

      console.log(`\n📧 Sending email via Gmail API`);
      console.log(`To: ${to}`);
      console.log(`From: ${this.senderEmail}`);
      console.log(`Subject: ${subject}`);

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      console.log(`✅ Email sent successfully to ${to}`);
      console.log(`   Message ID: ${response.data.id}`);

      return {
        success: true,
        messageId: response.data.id || `gmail-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
    } catch (error) {
      console.error('❌ Error sending email via Gmail API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendMagicLinkEmail(
    email: string,
    supplierName: string,
    magicLinkData: MagicLinkEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { subject, html } = createMagicLinkEmailTemplate(supplierName, magicLinkData);
    return this.sendEmail(email, subject, html);
  }

  async sendDocumentRequestEmail(
    recipient: { email: string; name: string },
    documentRequestData: DocumentRequestEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { subject, html } = createDocumentRequestEmailTemplate(recipient.name, documentRequestData);
    return this.sendEmail(recipient.email, subject, html);
  }

  async sendPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    passwordSetupData: PasswordSetupEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { subject, html } = createPasswordSetupEmailTemplate(firstName, lastName, passwordSetupData);
    return this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    lastName: string,
    passwordResetData: PasswordResetEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { subject, html } = createPasswordResetEmailTemplate(firstName, lastName, passwordResetData);
    return this.sendEmail(email, subject, html);
  }

  async sendDocumentUploadNotification(
    recipients: string[],
    notificationData: DocumentUploadNotificationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { subject, html } = createDocumentUploadNotificationTemplate(notificationData);

    console.log(`📧 Sending document upload notification to ${recipients.length} recipient(s)`);

    // Send to all recipients (admins/procurement staff)
    const results = await Promise.all(
      recipients.map(email => this.sendEmail(email, subject, html))
    );

    const allSuccessful = results.every(r => r.success);

    return {
      success: allSuccessful,
      messageId: allSuccessful ? results[0]?.messageId : undefined,
      error: allSuccessful ? undefined : 'Some notifications failed to send'
    };
  }

  private createContactEmailTemplate(data: ContactEmailData): string {
    const formattedDate = new Date(data.timestamp).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Form Submission</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 32px 24px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 18px; font-weight: 600; color: #1e40af; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #6b7280; width: 180px; flex-shrink: 0; }
    .detail-value { color: #1f2937; flex: 1; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .info-box { background: #f9fafb; padding: 16px; border-radius: 6px; margin-top: 8px; white-space: pre-wrap; }
    @media only screen and (max-width: 600px) {
      .detail-row { flex-direction: column; }
      .detail-label { width: 100%; margin-bottom: 4px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Contact Form Submission</h1>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">Contact Information</div>
        <div class="detail-row">
          <div class="detail-label">Name:</div>
          <div class="detail-value"><strong>${data.name}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Position:</div>
          <div class="detail-value">${data.position}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Email:</div>
          <div class="detail-value">${data.email}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Phone:</div>
          <div class="detail-value">${data.countryCode} ${data.mobileNumber}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Submitted:</div>
          <div class="detail-value">${formattedDate}</div>
        </div>
      </div>
      
      ${data.otherInfo ? `
      <div class="section">
        <div class="section-title">Additional Information</div>
        <div class="info-box">${data.otherInfo}</div>
      </div>` : ''}
    </div>
    
    <div class="footer">
      <p><strong>Metal Fabrication Portal</strong></p>
      <p>This is an automated message from the contact form.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private createMessage({
    to,
    toName,
    subject,
    html,
  }: {
    to: string;
    toName?: string;
    subject: string;
    html: string;
  }): string {
    const toHeader = toName ? `${toName} <${to}>` : to;
    
    const message = [
      `To: ${toHeader}`,
      `From: ${this.senderEmail}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      html,
    ].join('\n');

    // Encode the message in base64url format
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

// Create singleton instance (lazy initialization - only creates when first accessed)
let emailServiceInstance: GoogleGmailEmailService | null = null;

function getEmailService(): GoogleGmailEmailService {
  if (!emailServiceInstance) {
    try {
      emailServiceInstance = new GoogleGmailEmailService();
      console.log('✅ Google Gmail email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Gmail email service:', error instanceof Error ? error.message : error);
      throw error;
    }
  }
  return emailServiceInstance;
}

// Export proxy object that lazily initializes the service only when methods are called
export const emailService = new Proxy({} as GoogleGmailEmailService, {
  get(_target, prop) {
    const service = getEmailService();
    const value = (service as any)[prop];
    if (typeof value === 'function') {
      return value.bind(service);
    }
    return value;
  }
});

