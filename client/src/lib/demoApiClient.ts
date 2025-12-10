/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuidv4 } from "uuid";
import { buildUserForRole, getDemoSession, resetDemoSession, updateDemoSession } from "./demoSession";
import type { DemoRole } from "./demoSession";

export const DEMO_MODE = true;

type HandlerResult = { status: number; data?: any; headers?: Record<string, string> };

const jsonHeaders = { "Content-Type": "application/json" };

const sleep = (ms = 200) => new Promise((r) => setTimeout(r, ms));

function toResponse(result: HandlerResult): Response {
  const { status, data, headers } = result;
  if (data === undefined || data === null) {
    return new Response(null, { status, headers });
  }
  return new Response(JSON.stringify(data), { status, headers: { ...jsonHeaders, ...headers } });
}

function parseBody(body: any) {
  if (!body) return undefined;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  if (body instanceof FormData) {
    const obj: Record<string, any> = {};
    body.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
  return body;
}

function normalizeDate(value: any) {
  return new Date(value);
}

function enrichQuoteRequests(session: ReturnType<typeof getDemoSession>) {
  const { quoteRequests, supplierQuotes } = session.data;
  return quoteRequests.map((qr) => {
    const quotes = supplierQuotes.filter((q) => q.requestId === qr.id);
    const quotesReceived = quotes.length;
    const totalSuppliers = qr.invitedSupplierIds.length;
    const hasPendingDocs = quotes.some((q) => q.preliminaryApprovalStatus === "pending_documentation");
    return {
      ...qr,
      quotesReceived,
      totalSuppliers,
      hasPendingDocs,
    };
  });
}

function getSupplierById(id: string) {
  return getDemoSession().data.suppliers.find((s) => s.id === id);
}

function buildQuoteDetails(quoteId: string) {
  const session = getDemoSession();
  const quote = session.data.supplierQuotes.find((q) => q.id === quoteId);
  if (!quote) return null;
  const supplier = session.data.suppliers.find((s) => s.id === quote.supplierId);
  const request = session.data.quoteRequests.find((r) => r.id === quote.requestId);
  if (!supplier || !request) return null;
  return { quote, supplier, request };
}

function computeAdminStats() {
  const session = getDemoSession();
  const quotes = session.data.supplierQuotes;
  const quoteRequests = session.data.quoteRequests;
  const activeRequests = quoteRequests.filter((qr) => qr.status === "active").length;
  const totalSuppliers = session.data.suppliers.length;
  const pendingQuotes = quotes.filter((q) => q.preliminaryApprovalStatus === "pending_documentation").length;
  const averageResponseTimeHours = 12;
  return { activeRequests, totalSuppliers, pendingQuotes, averageResponseTimeHours };
}

function computeSupplierStats(currentSupplierId?: string) {
  const session = getDemoSession();
  const supplierId = currentSupplierId || session.currentSupplierId || session.data.suppliers[0]?.id;
  const requests = session.data.quoteRequests.filter((qr) => qr.invitedSupplierIds.includes(supplierId));
  const quotes = session.data.supplierQuotes.filter((q) => q.supplierId === supplierId);
  const nowDate = new Date();

  const hasQuoteIds = new Set(quotes.map((q) => q.requestId));
  const totalRequests = requests.length;
  const ongoing = requests.filter((r) => !hasQuoteIds.has(r.id) && normalizeDate(r.submitByDate) >= nowDate).length;
  const expired = requests.filter((r) => !hasQuoteIds.has(r.id) && normalizeDate(r.submitByDate) < nowDate).length;
  const pendingDocumentation = quotes.filter((q) => q.preliminaryApprovalStatus === "pending_documentation").length;
  const finalSubmitted = quotes.filter((q) => q.preliminaryApprovalStatus === "final_submitted").length;
  const initialSubmitted = quotes.filter((q) => q.preliminaryApprovalStatus === "initial_submitted").length;
  const quotesSubmitted = quotes.length;

  return {
    totalRequests,
    ongoing,
    pendingDocumentation,
    expired,
    finalSubmitted,
    initialSubmitted,
    quotesSubmitted,
  };
}

function createNotification(userId: string, payload: Partial<Omit<ReturnType<typeof buildUserForRole>, "id">> & { title: string; message: string; type: string; relatedQuoteId?: string | null; relatedRequestId?: string | null }) {
  updateDemoSession((session) => {
    session.data.notifications.unshift({
      id: uuidv4(),
      userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      relatedQuoteId: payload.relatedQuoteId ?? null,
      relatedRequestId: payload.relatedRequestId ?? null,
      isRead: false,
      createdAt: new Date(),
    });
    return session;
  });
}

function getRoleFromSession(): DemoRole {
  return getDemoSession().role;
}

function handleGet(path: string, searchParams: URLSearchParams): HandlerResult | null {
  const session = getDemoSession();

  if (path === "/api/admin/dashboard") {
    return { status: 200, data: computeAdminStats() };
  }

  if (path === "/api/suppliers") {
    return { status: 200, data: session.data.suppliers };
  }

  if (path === "/api/quote-requests") {
    return { status: 200, data: enrichQuoteRequests(session) };
  }

  if (path.startsWith("/api/quote-requests/")) {
    const id = path.split("/")[3];
    const request = session.data.quoteRequests.find((qr) => qr.id === id);
    if (!request) return { status: 404, data: { message: "Quote request not found" } };

    const suppliers = request.invitedSupplierIds.map((supplierId) => {
      const supplier = session.data.suppliers.find((s) => s.id === supplierId);
      const quote = session.data.supplierQuotes.find((q) => q.requestId === request.id && q.supplierId === supplierId);
      return {
        id: supplierId,
        supplierName: supplier?.supplierName || "Supplier",
        email: supplier?.email || "supplier@example.com",
        requestSupplierId: `req-sup-${supplierId}`,
        emailSentAt: new Date(request.createdAt),
        quote: quote
          ? {
              id: quote.id,
              pricePerUnit: String(quote.pricePerUnit),
              leadTime: quote.leadTime || "2 weeks",
              moq: quote.moq || null,
              paymentTerms: quote.paymentTerms || null,
              additionalNotes: quote.additionalNotes || null,
              currency: quote.currency || "AUD",
              submittedAt: quote.submittedAt,
            }
          : null,
      };
    });

    return {
      status: 200,
      data: {
        request,
        suppliers,
      },
    };
  }

  if (path.startsWith("/api/quotes/")) {
    const parts = path.split("/");
    const quoteId = parts[3];
    if (parts[4] === "document-requests") {
      const docRequests = session.data.documentRequests.filter((dr) => dr.quoteId === quoteId);
      return { status: 200, data: docRequests };
    }

    if (parts[4] === "documents") {
      const documents = session.data.documents.filter((d) => d.supplierQuoteId === quoteId);
      return { status: 200, data: documents };
    }

    const details = buildQuoteDetails(quoteId);
    if (!details) return { status: 404, data: { message: "Quote not found" } };
    return { status: 200, data: details };
  }

  if (path === "/api/supplier/dashboard") {
    return { status: 200, data: computeSupplierStats(session.currentSupplierId) };
  }

  if (path === "/api/supplier/quote-requests") {
    const supplierId = session.currentSupplierId || session.data.suppliers[0]?.id;
    const nowDate = new Date();
    const requests = session.data.quoteRequests
      .filter((qr) => qr.invitedSupplierIds.includes(supplierId))
      .map((qr) => {
        const quote = session.data.supplierQuotes.find((q) => q.requestId === qr.id && q.supplierId === supplierId);
        const documentsRequested = session.data.documentRequests.filter((dr) => dr.quoteId === quote?.id);
        const documentsUploaded = session.data.documents.filter((d) => d.supplierQuoteId === quote?.id);
        return {
          id: qr.id,
          requestNumber: qr.requestNumber,
          materialName: qr.materialName,
          quantityNeeded: qr.quantityNeeded as any,
          unitOfMeasure: qr.unitOfMeasure,
          submitByDate: qr.submitByDate,
          status: qr.status,
          hasQuote: !!quote,
          isExpired: normalizeDate(qr.submitByDate) < nowDate,
          quote: quote
            ? {
                id: quote.id,
                pricePerUnit: String(quote.pricePerUnit),
                preliminaryApprovalStatus: quote.preliminaryApprovalStatus,
                submittedAt: quote.submittedAt,
                documentsRequested: documentsRequested[0]?.requestedDocuments.length ?? 0,
                documentsUploaded: documentsUploaded.length,
              }
            : undefined,
        };
      });
    return { status: 200, data: requests };
  }

  if (path.startsWith("/api/supplier/quotes/")) {
    const parts = path.split("/");
    const quoteId = parts[3];
    if (parts[4] === "documents") {
      const documents = session.data.documents.filter((d) => d.supplierQuoteId === quoteId);
      return { status: 200, data: documents.map((d) => ({ ...d, fileExists: true })) };
    }
  }

  if (path.startsWith("/api/notifications")) {
    const userId = getRoleFromSession() === "supplier" ? "demo-supplier-user" : "demo-admin-user";
    const notifications = session.data.notifications.filter((n) => n.userId === userId);
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return { status: 200, data: { notifications, unreadCount } };
  }

  if (path.startsWith("/api/public/quote-requests/")) {
    const id = path.split("/")[4];
    const token = searchParams.get("token");
    if (!token) return { status: 400, data: { message: "Missing token" } };
    const request = session.data.quoteRequests.find((qr) => qr.id === id);
    if (!request) return { status: 404, data: { message: "Not found" } };
    const supplier = getSupplierById(session.currentSupplierId || "sup-demo-1") || session.data.suppliers[0];
    return { status: 200, data: { request, supplier } };
  }

  if (path.startsWith("/api/documents/") && path.endsWith("/download")) {
    return { status: 200, data: { ok: true } };
  }

  if (path === "/api/supplier-applications") {
    const session = getDemoSession();
    // Ensure supplierApplications exists (fallback for old sessions)
    if (!session.data.supplierApplications) {
      session.data.supplierApplications = [];
    }
    return { status: 200, data: session.data.supplierApplications };
  }

  if (path.startsWith("/api/supplier-applications/")) {
    const id = path.split("/")[3];
    if (path.endsWith("/status")) {
      // This will be handled in handlePatch
      return null;
    }
    const application = getDemoSession().data.supplierApplications.find((app) => app.id === id);
    if (!application) return { status: 404, data: { message: "Application not found" } };
    return { status: 200, data: application };
  }

  return null;
}

function handlePost(path: string, body: any): HandlerResult | null {
  if (path === "/api/suppliers") {
    const supplier = {
      ...body,
      id: uuidv4(),
      createdBy: "demo-admin-user",
      createdAt: new Date(),
      updatedAt: new Date(),
      certifications: body.certifications || [],
      active: body.active ?? true,
    };
    updateDemoSession((session) => {
      session.data.suppliers.push(supplier);
      return session;
    });
    return { status: 200, data: supplier };
  }

  if (path === "/api/quote-requests" || path === "/api/quote-requests/draft") {
    const draft = path.endsWith("/draft");
    const session = getDemoSession();
    const sequence = session.data.quoteRequests.length + 4;
    const requestNumber = `MF-2025-${sequence.toString().padStart(3, "0")}`;
    const newRequest = {
      id: uuidv4(),
      requestNumber,
      status: draft ? "draft" : "active",
      createdBy: "demo-admin-user",
      createdAt: new Date(),
      updatedAt: new Date(),
      findNewSuppliers: body.findNewSuppliers ?? false,
      invitedSupplierIds: session.data.suppliers.slice(0, 3).map((s) => s.id),
      ...body,
    };
    updateDemoSession((sess) => {
      sess.data.quoteRequests.unshift(newRequest as any);
      return sess;
    });
    return { status: 200, data: newRequest };
  }

  if (path.includes("/resend-notification/")) {
    const [, , , requestId, , supplierId] = path.split("/");
    createNotification("demo-admin-user", {
      type: "quote_submitted",
      title: "Reminder sent",
      message: `Reminder sent to supplier ${supplierId} for ${requestId}`,
      relatedRequestId: requestId,
      relatedQuoteId: null,
    });
    return { status: 200, data: { ok: true } };
  }

  if (path === "/api/supplier/quotes") {
    const session = getDemoSession();
    const supplierId = session.currentSupplierId || session.data.suppliers[0]?.id;
    const quote = {
      id: uuidv4(),
      requestId: body.requestId,
      supplierId,
      pricePerUnit: Number(body.pricePerUnit ?? body.price) || 0,
      currency: "AUD",
      moq: body.moq || "100 units",
      leadTime: body.leadTime || "10 days",
      validityDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      paymentTerms: body.paymentTerms || "Net 30",
      additionalNotes: body.additionalNotes || "",
      attachments: [],
      packSize: body.packSize || null,
      shippingTerms: body.shippingTerms || "FOB",
      freightCost: body.freightCost ? Number(body.freightCost) : null,
      shelfLife: null,
      storageRequirements: null,
      dangerousGoodsHandling: null,
      preliminaryApprovalStatus: "initial_submitted",
      preliminaryApprovedAt: null,
      preliminaryApprovedBy: null,
      submittedAt: new Date(),
      status: "submitted",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    updateDemoSession((sess) => {
      sess.data.supplierQuotes.push(quote as any);
      return sess;
    });
    createNotification("demo-admin-user", {
      type: "quote_submitted",
      title: "New supplier quote",
      message: "A supplier submitted a new quote.",
      relatedQuoteId: quote.id,
      relatedRequestId: quote.requestId,
    });
    return { status: 200, data: quote };
  }

  if (path.startsWith("/api/public/quote-requests/") && path.endsWith("/submit-quote")) {
    const requestId = path.split("/")[4];
    const session = getDemoSession();
    const supplierId = session.currentSupplierId || session.data.suppliers[0]?.id;
    const quote = {
      id: uuidv4(),
      requestId,
      supplierId,
      pricePerUnit: Number(body.pricePerUnit) || 0,
      currency: "AUD",
      moq: body.moq || "N/A",
      leadTime: body.leadTime || "2 weeks",
      validityDate: new Date(),
      paymentTerms: body.paymentTerms || "Net 30",
      additionalNotes: body.additionalNotes || "",
      attachments: [],
      packSize: null,
      shippingTerms: "FOB",
      freightCost: null,
      shelfLife: null,
      storageRequirements: null,
      dangerousGoodsHandling: null,
      preliminaryApprovalStatus: "initial_submitted",
      preliminaryApprovedAt: null,
      preliminaryApprovedBy: null,
      submittedAt: new Date(),
      status: "submitted",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    updateDemoSession((sess) => {
      sess.data.supplierQuotes.push(quote as any);
      return sess;
    });
    createNotification("demo-admin-user", {
      type: "quote_submitted",
      title: "Public quote submitted",
      message: "A supplier submitted a quote via public link.",
      relatedQuoteId: quote.id,
      relatedRequestId: quote.requestId,
    });
    return { status: 200, data: quote };
  }

  if (path.startsWith("/api/quotes/") && path.endsWith("/request-documents")) {
    const quoteId = path.split("/")[3];
    const docRequest = {
      id: uuidv4(),
      quoteId,
      requestedDocuments: body.requestedDocuments || [],
      requestedBy: "demo-admin-user",
      requestedAt: new Date(),
      status: "pending",
      emailSentAt: new Date(),
      createdAt: new Date(),
    };
    updateDemoSession((session) => {
      session.data.documentRequests.push(docRequest as any);
      const quote = session.data.supplierQuotes.find((q) => q.id === quoteId);
      if (quote) {
        quote.preliminaryApprovalStatus = "pending_documentation";
      }
      return session;
    });
    return { status: 200, data: docRequest };
  }

  if (path.startsWith("/api/supplier/quotes/") && path.endsWith("/documents")) {
    const quoteId = path.split("/")[3];
    const fileName = body.file?.name || body.fileName || "Uploaded Document.pdf";
    const fileSize = body.file?.size || 500000;
    const mimeType = body.file?.type || "application/pdf";
    const document = {
      id: uuidv4(),
      supplierQuoteId: quoteId,
      documentType: body.documentType || "coa",
      fileUrl: `/demo/${fileName}`,
      fileName,
      fileSize,
      mimeType,
      uploadedBy: "demo-supplier-user",
      uploadedAt: new Date(),
      createdAt: new Date(),
    };
    updateDemoSession((session) => {
      session.data.documents.push(document as any);
      return session;
    });
    return { status: 200, data: document };
  }

  if (path === "/api/notifications/read-all") {
    updateDemoSession((session) => {
      const userId = getRoleFromSession() === "supplier" ? "demo-supplier-user" : "demo-admin-user";
      session.data.notifications = session.data.notifications.map((n) =>
        n.userId === userId ? { ...n, isRead: true } : n,
      );
      return session;
    });
    return { status: 200, data: { ok: true } };
  }

  if (path === "/api/supplier-applications") {
    const application = {
      ...body,
      id: uuidv4(),
      status: "pending",
      applicationDate: new Date(),
      reviewDate: null,
      reviewedBy: null,
      reviewNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    updateDemoSession((session) => {
      session.data.supplierApplications.unshift(application as any);
      return session;
    });
    return { status: 200, data: application };
  }

  if (path === "/api/contact") {
    // In demo mode, just return success without actually sending email
    // In production, this would send via Google Gmail API
    console.log("📧 Contact form submission (demo mode):", body);
    return { 
      status: 200, 
      data: { 
        success: true, 
        message: "Contact form submitted successfully" 
      } 
    };
  }

  return null;
}

function handlePatch(path: string, body: any): HandlerResult | null {
  if (path.startsWith("/api/suppliers/")) {
    const id = path.split("/")[3];
    let updatedSupplier;
    updateDemoSession((session) => {
      session.data.suppliers = session.data.suppliers.map((s) => {
        if (s.id === id) {
          updatedSupplier = { ...s, ...body, updatedAt: new Date() };
          return updatedSupplier;
        }
        return s;
      });
      return session;
    });
    if (!updatedSupplier) return { status: 404, data: { message: "Supplier not found" } };
    return { status: 200, data: updatedSupplier };
  }

  if (path.includes("/preliminary-approval")) {
    const quoteId = path.split("/")[3];
    updateDemoSession((session) => {
      const quote = session.data.supplierQuotes.find((q) => q.id === quoteId);
      if (quote) {
        quote.preliminaryApprovalStatus = body.status || "pending_documentation";
      }
      return session;
    });
    return { status: 200, data: { ok: true } };
  }

  if (path.startsWith("/api/notifications/") && path.endsWith("/read")) {
    const id = path.split("/")[3];
    updateDemoSession((session) => {
      session.data.notifications = session.data.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      );
      return session;
    });
    return { status: 200, data: { ok: true } };
  }

  if (path.startsWith("/api/supplier-applications/") && path.endsWith("/status")) {
    const id = path.split("/")[3];
    let updatedApplication;
    updateDemoSession((session) => {
      session.data.supplierApplications = session.data.supplierApplications.map((app) => {
        if (app.id === id) {
          updatedApplication = {
            ...app,
            status: body.status,
            reviewDate: new Date(),
            reviewedBy: "demo-admin-user",
            reviewNotes: body.reviewNotes || null,
            updatedAt: new Date(),
          };
          return updatedApplication;
        }
        return app;
      });
      return session;
    });
    if (!updatedApplication) return { status: 404, data: { message: "Application not found" } };
    return { status: 200, data: updatedApplication };
  }

  if (path.startsWith("/api/supplier-applications/") && path.endsWith("/approve")) {
    const id = path.split("/")[3];
    const application = getDemoSession().data.supplierApplications.find((app) => app.id === id);
    if (!application) return { status: 404, data: { message: "Application not found" } };
    if (application.status !== "approved") {
      return { status: 400, data: { message: "Application must be approved before converting" } };
    }
    // Convert to supplier (simplified - in real app would create supplier record)
    return { status: 200, data: { message: "Supplier created successfully", application } };
  }

  return null;
}

function handleDelete(path: string): HandlerResult | null {
  if (path.startsWith("/api/suppliers/")) {
    const id = path.split("/")[3];
    updateDemoSession((session) => {
      session.data.suppliers = session.data.suppliers.filter((s) => s.id !== id);
      session.data.quoteRequests = session.data.quoteRequests.map((qr) => ({
        ...qr,
        invitedSupplierIds: qr.invitedSupplierIds.filter((sid) => sid !== id),
      }));
      session.data.supplierQuotes = session.data.supplierQuotes.filter((q) => q.supplierId !== id);
      return session;
    });
    return { status: 200, data: { ok: true } };
  }

  if (path.startsWith("/api/quote-requests/")) {
    const id = path.split("/")[3];
    updateDemoSession((session) => {
      session.data.quoteRequests = session.data.quoteRequests.filter((qr) => qr.id !== id);
      session.data.supplierQuotes = session.data.supplierQuotes.filter((q) => q.requestId !== id);
      session.data.documentRequests = session.data.documentRequests.filter((dr) => dr.quoteId !== id);
      session.data.documents = session.data.documents.filter((d) => d.supplierQuoteId !== id);
      return session;
    });
    return { status: 200, data: { ok: true } };
  }

  if (path.startsWith("/api/supplier/documents/")) {
    const id = path.split("/")[4];
    updateDemoSession((session) => {
      session.data.documents = session.data.documents.filter((d) => d.id !== id);
      return session;
    });
    return { status: 200, data: { ok: true } };
  }

  return null;
}

function routeRequest(method: string, path: string, body: any, searchParams: URLSearchParams): HandlerResult {
  const lowerPath = path.toLowerCase();
  if (lowerPath === "/api/reset-demo") {
    resetDemoSession();
    return { status: 200, data: { ok: true } };
  }

  const getter = handleGet(path, searchParams);
  if (method === "GET") {
    if (getter) return getter;
    return { status: 404, data: { message: "Not found" } };
  }

  if (method === "POST") {
    if (path === "/api/leads") {
      const payload = {
        id: uuidv4(),
        name: body?.name || "Demo Visitor",
        email: body?.email || "unknown@example.com",
        companyName: body?.companyName || "Unknown Co",
        companyDomain: body?.companyDomain || null,
        sessionId: body?.sessionId || getDemoSession().sessionId,
        source: body?.source || "demo_popup",
        utmSource: body?.utmSource || null,
        utmMedium: body?.utmMedium || null,
        utmCampaign: body?.utmCampaign || null,
        pageViews: body?.pageViews ?? 0,
        actionsTaken: body?.actionsTaken || [],
        createdAt: new Date(),
      };
      updateDemoSession((session) => {
        session.data.leads.unshift(payload as any);
        return session;
      });
      return { status: 200, data: { success: true, lead: payload } };
    }

    const result = handlePost(path, body);
    if (result) return result;
    return { status: 404, data: { message: "Not found" } };
  }

  if (method === "PATCH") {
    const result = handlePatch(path, body);
    if (result) return result;
    return { status: 404, data: { message: "Not found" } };
  }

  if (method === "DELETE") {
    const result = handleDelete(path);
    if (result) return result;
    return { status: 404, data: { message: "Not found" } };
  }

  return { status: 405, data: { message: "Method not allowed" } };
}

export async function demoFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlString = typeof input === "string" ? input : input.toString();
  const url = new URL(urlString, window.location.origin);
  const path = url.pathname;
  const method = (init?.method || "GET").toUpperCase();
  const body = parseBody(init?.body);

  const result = routeRequest(method, path, body, url.searchParams);
  await sleep();
  return toResponse(result);
}
