import crypto from 'crypto';
import { getBaseUrl } from '../utils/baseUrl';

export interface EmailRecipient {
  email: string;
  name: string;
  supplierId: string;
}

export interface RFQEmailData {
  requestNumber: string;
  materialName: string;
  casNumber?: string;
  femaNumber?: string;
  quantityNeeded: string;
  unitOfMeasure: string;
  submitByDate: Date;
  additionalSpecifications?: string;
  accessToken: string;
  quoteSubmissionUrl: string;
}

/**
 * Generates a secure random access token for supplier quote submission
 */
export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generates the quote submission URL with access token
 */
export function generateQuoteSubmissionUrl(requestId: string, token: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/quote-submission/${requestId}?token=${token}`;
}

/**
 * Creates HTML email template for RFQ notification
 */
export function createRFQEmailTemplate(data: RFQEmailData, supplierName: string): string {
  const submitByFormatted = data.submitByDate.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request for Quote - ${data.requestNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 8px 0 0; opacity: 0.95; font-size: 16px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 16px; margin-bottom: 20px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 18px; font-weight: 600; color: #1e40af; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #6b7280; width: 180px; flex-shrink: 0; }
    .detail-value { color: #1f2937; flex: 1; }
    .cta-section { text-align: center; margin: 32px 0; padding: 24px; background: #f9fafb; border-radius: 8px; }
    .cta-button { display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; transition: background 0.3s; }
    .cta-button:hover { background: #1e3a8a; }
    .deadline-notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 20px 0; }
    .deadline-notice strong { color: #b45309; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .specs-box { background: #f9fafb; padding: 16px; border-radius: 6px; margin-top: 8px; white-space: pre-wrap; }
    @media only screen and (max-width: 600px) {
      .detail-row { flex-direction: column; }
      .detail-label { width: 100%; margin-bottom: 4px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Request for Quote</h1>
      <p>${data.requestNumber}</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear ${supplierName},
      </div>
      
      <p>Essential Flavours is requesting a quote for the following raw material. Please review the specifications below and submit your quotation through our secure portal.</p>
      
      <div class="section">
        <div class="section-title">Material Details</div>
        <div class="detail-row">
          <div class="detail-label">Material Name:</div>
          <div class="detail-value"><strong>${data.materialName}</strong></div>
        </div>
        ${data.casNumber ? `
        <div class="detail-row">
          <div class="detail-label">CAS Number:</div>
          <div class="detail-value">${data.casNumber}</div>
        </div>` : ''}
        ${data.femaNumber ? `
        <div class="detail-row">
          <div class="detail-label">FEMA Number:</div>
          <div class="detail-value">${data.femaNumber}</div>
        </div>` : ''}
      </div>
      
      <div class="section">
        <div class="section-title">Quantity Required</div>
        <div class="detail-row">
          <div class="detail-label">Quantity:</div>
          <div class="detail-value"><strong>${data.quantityNeeded} ${data.unitOfMeasure}</strong></div>
        </div>
      </div>
      
      ${data.additionalSpecifications ? `
      <div class="section">
        <div class="section-title">Additional Specifications</div>
        <div class="specs-box">${data.additionalSpecifications}</div>
      </div>` : ''}
      
      <div class="deadline-notice">
        <strong>Submission Deadline:</strong> ${submitByFormatted}
      </div>
      
      <div class="cta-section">
        <p style="margin-bottom: 16px; font-size: 15px;"><strong>Quick Submit:</strong> Click the button below to submit your quote:</p>
        <a href="${data.quoteSubmissionUrl}" class="cta-button">Submit Quote</a>
      </div>
      
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 12px; font-size: 15px; color: #1e40af;"><strong>New! Supplier Portal</strong></p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #1f2937;">
          Login to our supplier portal to view all your quote requests, track submission status, and manage your quotes in one place.
        </p>
        <a href="${getBaseUrl()}" 
           style="display: inline-block; background: white; color: #1e40af; text-decoration: none; padding: 10px 24px; border: 2px solid #1e40af; border-radius: 6px; font-weight: 600; font-size: 14px;">
          Login to Portal
        </a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
        If you have any questions regarding this request, please contact our procurement team at procurement@essentialflavours.com.au
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Essential Flavours</strong></p>
      <p>Australian Flavour Manufacturer</p>
      <p style="margin-top: 12px;">This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Mock email service - logs emails to console instead of sending
 * In production, replace with real email provider (SendGrid, Microsoft Graph API, etc.)
 */
export class MockEmailService {
  /**
   * Sends RFQ notification email to a supplier (mock - logs to console)
   */
  async sendRFQNotification(
    recipient: EmailRecipient,
    rfqData: RFQEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const htmlContent = createRFQEmailTemplate(rfqData, recipient.name);
      
      console.log('\n' + '='.repeat(80));
      console.log('📧 MOCK EMAIL - RFQ Notification');
      console.log('='.repeat(80));
      console.log(`To: ${recipient.name} <${recipient.email}>`);
      console.log(`From: Essential Flavours <noreply@essentialflavours.com.au>`);
      console.log(`Subject: Request for Quote - ${rfqData.requestNumber}`);
      console.log(`Supplier ID: ${recipient.supplierId}`);
      console.log(`Access Token: ${rfqData.accessToken}`);
      console.log(`Quote Submission URL: ${rfqData.quoteSubmissionUrl}`);
      console.log('-'.repeat(80));
      console.log('HTML Content Preview:');
      console.log('-'.repeat(80));
      console.log(htmlContent.substring(0, 500) + '...');
      console.log('='.repeat(80) + '\n');

      // Simulate successful email send
      return {
        success: true,
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`
      };
    } catch (error) {
      console.error('Error in mock email service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sends RFQ notifications to multiple suppliers
   */
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
        ...result
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
      console.log('\n' + '='.repeat(80));
      console.log('📧 MOCK EMAIL');
      console.log('='.repeat(80));
      console.log(`To: ${to}`);
      console.log(`From: Essential Flavours <noreply@essentialflavours.com.au>`);
      console.log(`Subject: ${subject}`);
      console.log('-'.repeat(80));
      console.log('HTML Content Preview:');
      console.log('-'.repeat(80));
      console.log(html.substring(0, 500) + '...');
      console.log('='.repeat(80) + '\n');

      return {
        success: true,
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`
      };
    } catch (error) {
      console.error('Error in mock email service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const emailService = new MockEmailService();
