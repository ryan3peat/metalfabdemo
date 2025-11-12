import { MicrosoftGraphEmailService } from './microsoftGraphEmailService';
import { MockEmailService } from './emailService';
import type { EmailRecipient, RFQEmailData } from './emailService';
import type { MagicLinkEmailData } from './magicLinkEmail';
import { createMagicLinkEmailTemplate } from './magicLinkEmail';
import type { DocumentRequestEmailData } from './documentRequestEmail';
import { createDocumentRequestEmailTemplate } from './documentRequestEmail';
import type { PasswordSetupEmailData } from './passwordSetupEmail';
import { createPasswordSetupEmailTemplate } from './passwordSetupEmail';
import type { DocumentUploadNotificationData } from './documentUploadNotificationEmail';
import { createDocumentUploadNotificationTemplate } from './documentUploadNotificationEmail';

interface EmailProvider {
  sendRFQNotification(
    recipient: EmailRecipient,
    rfqData: RFQEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;

  sendBulkRFQNotifications(
    recipients: EmailRecipient[],
    rfqData: RFQEmailData[]
  ): Promise<{ sent: number; failed: number; results: any[] }>;

  sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export class HybridEmailService implements EmailProvider {
  private primaryProvider: EmailProvider | null = null;
  private fallbackProvider: EmailProvider | null = null;
  private providerName: string;
  private allowMockFallback: boolean;

  constructor() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'graph';
    this.allowMockFallback = process.env.ALLOW_MOCK_FALLBACK === 'true';
    this.providerName = emailProvider;

    console.log(`\n📧 Email Service Configuration:`);
    console.log(`   Provider: ${emailProvider}`);
    console.log(`   Allow Mock Fallback: ${this.allowMockFallback}`);

    try {
      if (emailProvider === 'graph') {
        this.primaryProvider = new MicrosoftGraphEmailService();
        console.log(`   ✅ Microsoft Graph email service initialized`);
      } else if (emailProvider === 'mock') {
        this.primaryProvider = new MockEmailService();
        console.log(`   ✅ Mock email service initialized`);
      } else {
        throw new Error(`Invalid EMAIL_PROVIDER: ${emailProvider}. Must be 'graph' or 'mock'`);
      }

      if (this.allowMockFallback && emailProvider !== 'mock') {
        this.fallbackProvider = new MockEmailService();
        console.log(`   ✅ Mock email fallback enabled`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to initialize ${emailProvider} email provider:`, error);
      
      if (this.allowMockFallback) {
        console.log(`   ⚠️  Falling back to mock email service`);
        this.primaryProvider = new MockEmailService();
        this.providerName = 'mock (fallback)';
      } else {
        console.error(`   ❌ No fallback configured. Email sending will fail.`);
        console.error(`   💡 Set ALLOW_MOCK_FALLBACK=true to enable mock email fallback`);
        throw error;
      }
    }

    console.log(`\n`);
  }

  async sendRFQNotification(
    recipient: EmailRecipient,
    rfqData: RFQEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.primaryProvider) {
      return {
        success: false,
        error: 'No email provider configured',
      };
    }

    console.log(`📧 [${this.providerName}] Attempting to send RFQ email to ${recipient.email}`);

    const result = await this.primaryProvider.sendRFQNotification(recipient, rfqData);

    if (result.success) {
      console.log(`✅ [${this.providerName}] Email sent successfully to ${recipient.email}`);
      return result;
    }

    console.error(`❌ [${this.providerName}] Failed to send email to ${recipient.email}:`, result.error);

    if (this.fallbackProvider) {
      console.log(`⚠️  Attempting fallback to mock email service...`);
      const fallbackResult = await this.fallbackProvider.sendRFQNotification(recipient, rfqData);
      
      if (fallbackResult.success) {
        console.log(`✅ [mock fallback] Email logged successfully for ${recipient.email}`);
      }
      
      return fallbackResult;
    }

    console.error(`❌ No fallback available. Email delivery failed for ${recipient.email}`);
    console.error(`💡 To enable mock fallback for development, set ALLOW_MOCK_FALLBACK=true`);

    return result;
  }

  async sendBulkRFQNotifications(
    recipients: EmailRecipient[],
    rfqData: RFQEmailData[]
  ): Promise<{ sent: number; failed: number; results: any[] }> {
    if (!this.primaryProvider) {
      return {
        sent: 0,
        failed: recipients.length,
        results: recipients.map((r) => ({
          recipient: r.email,
          supplierId: r.supplierId,
          success: false,
          error: 'No email provider configured',
        })),
      };
    }

    console.log(`\n📧 [${this.providerName}] Sending bulk RFQ emails to ${recipients.length} suppliers`);

    const result = await this.primaryProvider.sendBulkRFQNotifications(recipients, rfqData);

    if (result.failed > 0 && this.fallbackProvider) {
      console.log(`\n⚠️  ${result.failed} emails failed. Attempting fallback for failed emails...`);
      
      const failedIndices: number[] = [];
      result.results.forEach((r, index) => {
        if (!r.success) {
          failedIndices.push(index);
        }
      });

      if (failedIndices.length > 0) {
        const failedRecipients = failedIndices.map((i) => recipients[i]);
        const failedData = failedIndices.map((i) => rfqData[i]);

        const fallbackResult = await this.fallbackProvider.sendBulkRFQNotifications(
          failedRecipients,
          failedData
        );

        console.log(`✅ [mock fallback] Logged ${fallbackResult.sent} failed emails`);

        failedIndices.forEach((originalIndex, i) => {
          result.results[originalIndex] = {
            ...result.results[originalIndex],
            ...fallbackResult.results[i],
            provider: 'mock (fallback)',
          };
        });

        result.sent += fallbackResult.sent;
        result.failed -= fallbackResult.sent;
      }
    }

    console.log(`\n📊 [${this.providerName}] Bulk Email Summary: ${result.sent} sent, ${result.failed} failed\n`);

    return result;
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.primaryProvider) {
      return {
        success: false,
        error: 'No email provider configured',
      };
    }

    console.log(`📧 [${this.providerName}] Attempting to send email to ${to}`);

    const result = await this.primaryProvider.sendEmail(to, subject, html);

    if (result.success) {
      console.log(`✅ [${this.providerName}] Email sent successfully to ${to}`);
      return result;
    }

    console.error(`❌ [${this.providerName}] Failed to send email to ${to}:`, result.error);

    if (this.fallbackProvider) {
      console.log(`⚠️  Attempting fallback to mock email service...`);
      const fallbackResult = await this.fallbackProvider.sendEmail(to, subject, html);
      
      if (fallbackResult.success) {
        console.log(`✅ [mock fallback] Email logged successfully for ${to}`);
      }
      
      return fallbackResult;
    }

    return result;
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

  async sendDocumentUploadNotification(
    recipients: string[],
    notificationData: DocumentUploadNotificationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { subject, html } = createDocumentUploadNotificationTemplate(notificationData);

    console.log(`📧 [${this.providerName}] Sending document upload notification to ${recipients.length} recipient(s)`);

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
}

export const emailService = new HybridEmailService();
