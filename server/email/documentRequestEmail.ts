export interface DocumentRequestEmailData {
  rfqNumber: string;
  materialName: string;
  requestedDocuments: string[];
  supplierPortalUrl: string;
}

const DOCUMENT_LABELS: Record<string, string> = {
  coa: "Certificate of Analysis (COA)",
  pif: "PIF",
  specification: "Specification",
  sds: "SDS",
  halal: "Halal - Certificate or compliance statement",
  kosher: "Kosher - Certificate or compliance statement",
  natural_status: "Natural status - Artificial, Nature Identical or Natural",
  process_flow: "Process Flow",
  gfsi_cert: "Supplier GFSI Cert - e.g. SQF, FSSC 22000 etc.",
  organic: "Organic - Certificate or compliance statement – if applicable",
};

export function createDocumentRequestEmailTemplate(
  supplierName: string,
  data: DocumentRequestEmailData
): { subject: string; html: string } {
  const documentList = data.requestedDocuments
    .map((doc) => `<li style="margin-bottom: 8px;">${DOCUMENT_LABELS[doc] || doc}</li>`)
    .join('');

  const subject = `Document Request - ${data.rfqNumber} - ${data.materialName}`;

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
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 8px 0 0; opacity: 0.95; font-size: 16px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 16px; margin-bottom: 20px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 18px; font-weight: 600; color: #059669; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #6b7280; width: 180px; flex-shrink: 0; }
    .detail-value { color: #1f2937; flex: 1; }
    .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px; margin: 24px 0; text-align: center; }
    .success-box .icon { font-size: 48px; margin-bottom: 12px; }
    .success-box h2 { color: #065f46; margin: 0 0 8px; font-size: 22px; }
    .success-box p { color: #047857; margin: 0; font-size: 15px; }
    .documents-list { background: #f9fafb; padding: 20px; border-radius: 6px; margin-top: 16px; }
    .documents-list ul { margin: 0; padding-left: 24px; }
    .documents-list li { color: #1f2937; line-height: 1.8; }
    .cta-section { text-align: center; margin: 32px 0; padding: 24px; background: #f9fafb; border-radius: 8px; }
    .cta-button { display: inline-block; background: #059669; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; transition: background 0.3s; }
    .cta-button:hover { background: #047857; }
    .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 20px 0; }
    .info-box p { margin: 0; color: #1e40af; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    @media only screen and (max-width: 600px) {
      .detail-row { flex-direction: column; }
      .detail-label { width: 100%; margin-bottom: 4px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <p>Your Quote Has Been Shortlisted</p>
    </div>

    <div class="content">
      <div class="greeting">
        Dear ${supplierName},
      </div>

      <div class="success-box">
        <div class="icon">✓</div>
        <h2>You've Been Shortlisted!</h2>
        <p>Thank you for submitting your quote for <strong>${data.materialName}</strong></p>
      </div>

      <p>Your quote has been reviewed and you have been shortlisted for this opportunity. To proceed to the next stage, we kindly request the following documentation:</p>

      <div class="section">
        <div class="section-title">Requested Documents</div>
        <div class="documents-list">
          <ul>
            ${documentList}
          </ul>
        </div>
      </div>

      <div class="info-box">
        <p><strong>📋 RFQ Reference:</strong> ${data.rfqNumber}</p>
      </div>

      <div class="cta-section">
        <p style="margin-bottom: 16px; font-size: 15px;"><strong>Upload Your Documents:</strong></p>
        <p style="margin-bottom: 20px; color: #6b7280; font-size: 14px;">Please log in to the Supplier Portal to upload the requested documents</p>
        <a href="${data.supplierPortalUrl}" class="cta-button">Go to Supplier Portal</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Once logged in, navigate to your quote submission to upload the required documentation. If you have any questions or need assistance, please don't hesitate to contact us.</p>
    </div>

    <div class="footer">
      <p><strong>Essential Flavours</strong></p>
      <p>Supplier Portal - Procurement Team</p>
      <p style="margin-top: 12px;">This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}
