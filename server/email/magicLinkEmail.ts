export interface MagicLinkEmailData {
  magicLink: string;
  expiryMinutes: number;
}

export function createMagicLinkEmailTemplate(
  supplierName: string,
  data: MagicLinkEmailData
): { subject: string; html: string } {
  const subject = 'Your Login Link - Essential Flavours Supplier Portal';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 8px 0 0; opacity: 0.95; font-size: 16px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 16px; margin-bottom: 20px; }
    .message { font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.7; }
    .cta-section { text-align: center; margin: 32px 0; padding: 24px; background: #f9fafb; border-radius: 8px; }
    .cta-button { display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; transition: background 0.3s; }
    .cta-button:hover { background: #1e3a8a; }
    .expiry-notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 20px 0; }
    .expiry-notice strong { color: #b45309; }
    .security-note { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 20px 0; font-size: 14px; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .footer-link { color: #3b82f6; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .content { padding: 24px 16px; }
      .cta-button { display: block; padding: 14px 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Supplier Portal Login</h1>
      <p>Essential Flavours</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Hello ${supplierName},
      </div>
      
      <div class="message">
        You requested access to the Essential Flavours Supplier Portal. Click the button below to log in securely. No password needed!
      </div>

      <div class="cta-section">
        <a href="${data.magicLink}" class="cta-button" style="color: #ffffff !important; text-decoration: none;">
          Log In to Supplier Portal
        </a>
      </div>

      <div class="expiry-notice">
        <strong>⏱️ Important:</strong> This link will expire in ${data.expiryMinutes} minutes for your security. If it expires, simply request a new login link from the portal.
      </div>

      <div class="security-note">
        <strong>🔒 Security Note:</strong> This link can only be used once. If you didn't request this login link, you can safely ignore this email. Your account remains secure.
      </div>

      <div class="message">
        Once logged in, you'll be able to:
        <ul style="color: #4b5563; margin-top: 8px;">
          <li>View all quote requests sent to you</li>
          <li>Submit quotes and pricing information</li>
          <li>Access your complete quote history</li>
          <li>Upload required documents</li>
        </ul>
      </div>

      <div class="message" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
        <strong>Need help?</strong><br>
        If you have any questions or need assistance, please contact our procurement team at Essential Flavours.
      </div>
    </div>

    <div class="footer">
      <p><strong>Essential Flavours</strong></p>
      <p>Supplier Quotation Portal</p>
      <p style="margin-top: 16px; font-size: 12px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html };
}
