import {
  users,
  suppliers,
  quoteRequests,
  requestSuppliers,
  supplierQuotes,
  supplierDocuments,
  documentRequests,
  magicLinks,
  type User,
  type UpsertUser,
  type Supplier,
  type InsertSupplier,
  type QuoteRequest,
  type InsertQuoteRequest,
  type RequestSupplier,
  type InsertRequestSupplier,
  type SupplierQuote,
  type InsertSupplierQuote,
  type SupplierDocument,
  type InsertSupplierDocument,
  type DocumentRequest,
  type InsertDocumentRequest,
  type MagicLink,
  type InsertMagicLink,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: 'admin' | 'supplier' | 'procurement'): Promise<User | undefined>;
  updateUserStatus(id: string, active: boolean): Promise<User | undefined>;
  setUserPassword(id: string, passwordHash: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  getSupplierByEmail(email: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<void>;
  
  // Quote request operations
  getQuoteRequests(): Promise<QuoteRequest[]>;
  getQuoteRequest(id: string): Promise<QuoteRequest | undefined>;
  createQuoteRequest(request: InsertQuoteRequest): Promise<QuoteRequest>;
  updateQuoteRequest(id: string, request: Partial<InsertQuoteRequest>): Promise<QuoteRequest | undefined>;
  
  // Request supplier operations
  createRequestSupplier(requestSupplier: InsertRequestSupplier): Promise<RequestSupplier>;
  getRequestSuppliers(requestId: string): Promise<RequestSupplier[]>;
  updateRequestSupplier(id: string, data: Partial<InsertRequestSupplier>): Promise<RequestSupplier | undefined>;
  
  // Supplier quote operations
  getSupplierQuotes(requestId: string): Promise<SupplierQuote[]>;
  getSupplierQuote(quoteId: string): Promise<SupplierQuote | undefined>;
  createSupplierQuote(quote: InsertSupplierQuote): Promise<SupplierQuote>;
  updateSupplierQuote(id: string, quote: Partial<InsertSupplierQuote>): Promise<SupplierQuote | undefined>;
  
  // Supplier portal operations
  getSupplierQuoteRequests(supplierId: string): Promise<Array<{
    request: QuoteRequest;
    requestSupplier: RequestSupplier;
    quote: SupplierQuote | null;
  }>>;
  
  // Document operations
  getSupplierDocuments(quoteId: string): Promise<SupplierDocument[]>;
  createSupplierDocument(document: InsertSupplierDocument): Promise<SupplierDocument>;
  deleteSupplierDocument(id: string): Promise<void>;

  // Document request operations
  createDocumentRequest(documentRequest: InsertDocumentRequest): Promise<DocumentRequest>;
  updateDocumentRequestEmailSent(id: string, emailSentAt: Date): Promise<void>;
  getDocumentRequestsByQuote(quoteId: string): Promise<DocumentRequest[]>;

  // Quote request details with all related data
  getQuoteRequestDetails(requestId: string): Promise<{
    request: QuoteRequest;
    suppliers: Array<{
      id: string;
      supplierName: string;
      email: string;
      requestSupplierId: string;
      quote: SupplierQuote | null;
    }>;
  } | undefined>;

  // Get individual quote details with supplier and request info
  getQuoteDetails(quoteId: string): Promise<{
    quote: SupplierQuote;
    supplier: Supplier;
    request: QuoteRequest;
  } | undefined>;

  // Dashboard statistics
  getAdminDashboardStats(): Promise<{
    activeRequests: number;
    totalSuppliers: number;
    pendingQuotes: number;
    averageResponseTimeHours: number | null;
  }>;
  
  // Utility
  generateRfqNumber(): Promise<string>;
  
  // Magic link operations
  createMagicLink(magicLink: InsertMagicLink): Promise<MagicLink>;
  getMagicLinkByTokenHash(tokenHash: string): Promise<MagicLink | undefined>;
  markMagicLinkAsUsed(id: string): Promise<void>;
  cleanupExpiredMagicLinks(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user exists by email first
    if (userData.email) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));

      if (existingUser) {
        // Update existing user - exclude id to avoid foreign key issues
        const { id, ...updateData } = userData;
        const [updatedUser] = await db
          .update(users)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();
        return updatedUser;
      }
    }

    // Insert new user with conflict on ID
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: 'admin' | 'supplier' | 'procurement'): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStatus(id: string, active: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ active, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async setUserPassword(id: string, passwordHash: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ passwordHash, passwordSetAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async getSupplierByEmail(email: string): Promise<Supplier | undefined> {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(sql`${suppliers.email} = ${email} OR ${suppliers.email2} = ${email}`)
      .limit(1);
    return supplier;
  }

  async createSupplier(supplierData: InsertSupplier): Promise<Supplier> {
    // Create user accounts for the supplier's email addresses
    const emailsToProcess = [supplierData.email];
    if (supplierData.email2) {
      emailsToProcess.push(supplierData.email2);
    }

    for (const email of emailsToProcess) {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      
      if (!existingUser) {
        // Create a new supplier user account
        await db.insert(users).values({
          email,
          firstName: supplierData.contactPerson.split(' ')[0] || supplierData.contactPerson,
          lastName: supplierData.contactPerson.split(' ').slice(1).join(' ') || '',
          role: 'supplier',
          companyName: supplierData.supplierName,
          active: true,
        });
      }
    }

    // Create the supplier record
    const [supplier] = await db.insert(suppliers).values(supplierData).returning();
    return supplier;
  }

  async updateSupplier(id: string, supplierData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db
      .update(suppliers)
      .set({ ...supplierData, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  // Quote request operations
  async getQuoteRequests(): Promise<QuoteRequest[]> {
    // Get all quote requests with quote counts
    const requests = await db
      .select({
        quoteRequest: quoteRequests,
        supplierId: requestSuppliers.supplierId,
        quoteId: supplierQuotes.id,
      })
      .from(quoteRequests)
      .leftJoin(requestSuppliers, eq(requestSuppliers.requestId, quoteRequests.id))
      .leftJoin(
        supplierQuotes,
        and(
          eq(supplierQuotes.requestId, quoteRequests.id),
          eq(supplierQuotes.supplierId, requestSuppliers.supplierId)
        )
      )
      .orderBy(desc(quoteRequests.createdAt));

    // Group by quote request and count unique suppliers/quotes
    const requestsMap = new Map<string, {
      request: QuoteRequest;
      suppliers: Set<string>;
      quotes: Set<string>;
    }>();
    
    for (const row of requests) {
      const request = row.quoteRequest;
      if (!requestsMap.has(request.id)) {
        requestsMap.set(request.id, {
          request,
          suppliers: new Set(),
          quotes: new Set(),
        });
      }
      
      const mapped = requestsMap.get(request.id)!;
      if (row.supplierId) {
        mapped.suppliers.add(row.supplierId);
      }
      if (row.quoteId) {
        mapped.quotes.add(row.quoteId);
      }
    }

    // Convert to final format with counts
    return Array.from(requestsMap.values()).map(({ request, suppliers, quotes }) => ({
      ...request,
      quotesReceived: quotes.size,
      totalSuppliers: suppliers.size,
    }));
  }

  async getQuoteRequest(id: string): Promise<QuoteRequest | undefined> {
    const [request] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id));
    return request;
  }

  async createQuoteRequest(requestData: InsertQuoteRequest): Promise<QuoteRequest> {
    const [request] = await db.insert(quoteRequests).values(requestData).returning();
    return request;
  }

  async updateQuoteRequest(id: string, requestData: Partial<InsertQuoteRequest>): Promise<QuoteRequest | undefined> {
    const [request] = await db
      .update(quoteRequests)
      .set({ ...requestData, updatedAt: new Date() })
      .where(eq(quoteRequests.id, id))
      .returning();
    return request;
  }

  // Request supplier operations
  async createRequestSupplier(requestSupplierData: InsertRequestSupplier): Promise<RequestSupplier> {
    const [requestSupplier] = await db.insert(requestSuppliers).values(requestSupplierData).returning();
    return requestSupplier;
  }

  async getRequestSuppliers(requestId: string): Promise<RequestSupplier[]> {
    return await db.select().from(requestSuppliers).where(eq(requestSuppliers.requestId, requestId));
  }

  async updateRequestSupplier(id: string, data: Partial<InsertRequestSupplier>): Promise<RequestSupplier | undefined> {
    const [updated] = await db.update(requestSuppliers).set(data).where(eq(requestSuppliers.id, id)).returning();
    return updated;
  }

  // Supplier quote operations
  async getSupplierQuotes(requestId: string): Promise<SupplierQuote[]> {
    return await db.select().from(supplierQuotes).where(eq(supplierQuotes.requestId, requestId));
  }

  async getSupplierQuote(quoteId: string): Promise<SupplierQuote | undefined> {
    const [quote] = await db.select().from(supplierQuotes).where(eq(supplierQuotes.id, quoteId));
    return quote;
  }

  async createSupplierQuote(quoteData: InsertSupplierQuote): Promise<SupplierQuote> {
    const [quote] = await db.insert(supplierQuotes).values(quoteData).returning();
    return quote;
  }

  async updateSupplierQuote(id: string, quoteData: Partial<InsertSupplierQuote>): Promise<SupplierQuote | undefined> {
    const [quote] = await db
      .update(supplierQuotes)
      .set({ ...quoteData, updatedAt: new Date() })
      .where(eq(supplierQuotes.id, id))
      .returning();
    return quote;
  }

  // Supplier portal operations
  async getSupplierQuoteRequests(supplierId: string): Promise<Array<{
    request: QuoteRequest;
    requestSupplier: RequestSupplier;
    quote: SupplierQuote | null;
  }>> {
    // Get all request_suppliers entries for this supplier
    const requestSuppliersData = await db
      .select()
      .from(requestSuppliers)
      .where(eq(requestSuppliers.supplierId, supplierId))
      .orderBy(desc(requestSuppliers.createdAt));

    // Get all requests and quotes in parallel
    const results = await Promise.all(
      requestSuppliersData.map(async (rs) => {
        const [request] = await db
          .select()
          .from(quoteRequests)
          .where(eq(quoteRequests.id, rs.requestId));
        
        const [quote] = await db
          .select()
          .from(supplierQuotes)
          .where(
            and(
              eq(supplierQuotes.requestId, rs.requestId),
              eq(supplierQuotes.supplierId, supplierId)
            )
          );

        return {
          request,
          requestSupplier: rs,
          quote: quote || null,
        };
      })
    );

    return results.filter(r => r.request !== undefined);
  }

  // Document operations
  async getSupplierDocuments(quoteId: string): Promise<SupplierDocument[]> {
    return await db
      .select()
      .from(supplierDocuments)
      .where(eq(supplierDocuments.supplierQuoteId, quoteId))
      .orderBy(desc(supplierDocuments.uploadedAt));
  }

  async createSupplierDocument(documentData: InsertSupplierDocument): Promise<SupplierDocument> {
    const [document] = await db.insert(supplierDocuments).values(documentData).returning();
    return document;
  }

  async deleteSupplierDocument(id: string): Promise<void> {
    await db.delete(supplierDocuments).where(eq(supplierDocuments.id, id));
  }

  // Document request operations
  async createDocumentRequest(documentRequestData: InsertDocumentRequest): Promise<DocumentRequest> {
    const [documentRequest] = await db.insert(documentRequests).values(documentRequestData).returning();
    return documentRequest;
  }

  async updateDocumentRequestEmailSent(id: string, emailSentAt: Date): Promise<void> {
    await db
      .update(documentRequests)
      .set({ emailSentAt })
      .where(eq(documentRequests.id, id));
  }

  async getDocumentRequestsByQuote(quoteId: string): Promise<DocumentRequest[]> {
    return await db
      .select()
      .from(documentRequests)
      .where(eq(documentRequests.quoteId, quoteId))
      .orderBy(desc(documentRequests.requestedAt));
  }

  async getQuoteRequestDetails(requestId: string): Promise<{
    request: QuoteRequest;
    suppliers: Array<{
      id: string;
      supplierName: string;
      email: string;
      requestSupplierId: string;
      quote: SupplierQuote | null;
    }>;
  } | undefined> {
    // Get the quote request
    const [request] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, requestId));
    if (!request) return undefined;

    // Get all suppliers for this request with their quotes
    const requestSuppliersData = await db
      .select({
        requestSupplierId: requestSuppliers.id,
        supplierId: requestSuppliers.supplierId,
        supplierName: suppliers.supplierName,
        email: suppliers.email,
      })
      .from(requestSuppliers)
      .leftJoin(suppliers, eq(requestSuppliers.supplierId, suppliers.id))
      .where(eq(requestSuppliers.requestId, requestId));

    // Get all quotes for this request
    const quotes = await this.getSupplierQuotes(requestId);

    // Map suppliers with their quotes
    const suppliersWithQuotes = requestSuppliersData.map(rs => {
      const quote = quotes.find(q => q.supplierId === rs.supplierId) || null;
      return {
        id: rs.supplierId!,
        supplierName: rs.supplierName!,
        email: rs.email!,
        requestSupplierId: rs.requestSupplierId,
        quote,
      };
    });

    return {
      request,
      suppliers: suppliersWithQuotes,
    };
  }

  async getQuoteDetails(quoteId: string): Promise<{
    quote: SupplierQuote;
    supplier: Supplier;
    request: QuoteRequest;
  } | undefined> {
    // Get the quote
    const [quote] = await db.select().from(supplierQuotes).where(eq(supplierQuotes.id, quoteId));
    if (!quote) return undefined;

    // Get the supplier
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, quote.supplierId));
    if (!supplier) return undefined;

    // Get the quote request
    const [request] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, quote.requestId));
    if (!request) return undefined;

    return {
      quote,
      supplier,
      request,
    };
  }

  // Dashboard statistics
  async getAdminDashboardStats(): Promise<{
    activeRequests: number;
    totalSuppliers: number;
    pendingQuotes: number;
    averageResponseTimeHours: number | null;
  }> {
    // Count active quote requests
    const [activeResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quoteRequests)
      .where(eq(quoteRequests.status, 'active'));
    
    // Count total suppliers
    const [suppliersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppliers);
    
    // Count pending quotes
    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(supplierQuotes)
      .where(eq(supplierQuotes.preliminaryApprovalStatus, 'pending'));
    
    // Calculate average response time
    const [avgResult] = await db
      .select({
        avgHours: sql<number | null>`
          AVG(EXTRACT(EPOCH FROM (${supplierQuotes.submittedAt} - ${quoteRequests.createdAt})) / 3600)
        `,
      })
      .from(supplierQuotes)
      .innerJoin(quoteRequests, eq(supplierQuotes.requestId, quoteRequests.id))
      .where(sql`${supplierQuotes.submittedAt} IS NOT NULL`);
    
    return {
      activeRequests: Number(activeResult.count),
      totalSuppliers: Number(suppliersResult.count),
      pendingQuotes: Number(pendingResult.count),
      averageResponseTimeHours: avgResult.avgHours !== null && avgResult.avgHours !== undefined ? Number(avgResult.avgHours) : null,
    };
  }

  // Utility
  async generateRfqNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quoteRequests)
      .where(sql`EXTRACT(YEAR FROM created_at) = ${year}`);
    
    const count = Number(result.count) + 1;
    const paddedCount = count.toString().padStart(5, '0');
    return `RFQ-${year}-${paddedCount}`;
  }

  // Magic link operations
  async createMagicLink(magicLink: InsertMagicLink): Promise<MagicLink> {
    const [created] = await db.insert(magicLinks).values(magicLink).returning();
    return created;
  }

  async getMagicLinkByTokenHash(tokenHash: string): Promise<MagicLink | undefined> {
    const [link] = await db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.tokenHash, tokenHash));
    return link;
  }

  async markMagicLinkAsUsed(id: string): Promise<void> {
    await db
      .update(magicLinks)
      .set({ usedAt: new Date() })
      .where(eq(magicLinks.id, id));
  }

  async cleanupExpiredMagicLinks(): Promise<number> {
    const result = await db
      .delete(magicLinks)
      .where(
        sql`${magicLinks.expiresAt} < NOW() OR ${magicLinks.usedAt} IS NOT NULL`
      );
    return result.rowCount || 0;
  }
}

export const storage = new DatabaseStorage();
