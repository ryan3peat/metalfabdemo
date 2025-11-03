import {
  users,
  suppliers,
  rawMaterials,
  quoteRequests,
  requestSuppliers,
  supplierQuotes,
  type User,
  type UpsertUser,
  type Supplier,
  type InsertSupplier,
  type RawMaterial,
  type InsertRawMaterial,
  type QuoteRequest,
  type InsertQuoteRequest,
  type RequestSupplier,
  type InsertRequestSupplier,
  type SupplierQuote,
  type InsertSupplierQuote,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: 'admin' | 'supplier' | 'procurement'): Promise<User | undefined>;
  updateUserStatus(id: string, active: boolean): Promise<User | undefined>;
  
  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<void>;
  
  // Raw material operations
  getRawMaterials(): Promise<RawMaterial[]>;
  getRawMaterial(id: string): Promise<RawMaterial | undefined>;
  createRawMaterial(material: InsertRawMaterial): Promise<RawMaterial>;
  
  // Quote request operations
  getQuoteRequests(): Promise<QuoteRequest[]>;
  getQuoteRequest(id: string): Promise<QuoteRequest | undefined>;
  createQuoteRequest(request: InsertQuoteRequest): Promise<QuoteRequest>;
  updateQuoteRequest(id: string, request: Partial<InsertQuoteRequest>): Promise<QuoteRequest | undefined>;
  
  // Request supplier operations
  createRequestSupplier(requestSupplier: InsertRequestSupplier): Promise<RequestSupplier>;
  getRequestSuppliers(requestId: string): Promise<RequestSupplier[]>;
  
  // Supplier quote operations
  getSupplierQuotes(requestId: string): Promise<SupplierQuote[]>;
  createSupplierQuote(quote: InsertSupplierQuote): Promise<SupplierQuote>;
  
  // Utility
  generateRfqNumber(): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
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

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplierData: InsertSupplier): Promise<Supplier> {
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

  // Raw material operations
  async getRawMaterials(): Promise<RawMaterial[]> {
    return await db.select().from(rawMaterials).orderBy(desc(rawMaterials.createdAt));
  }

  async getRawMaterial(id: string): Promise<RawMaterial | undefined> {
    const [material] = await db.select().from(rawMaterials).where(eq(rawMaterials.id, id));
    return material;
  }

  async createRawMaterial(materialData: InsertRawMaterial): Promise<RawMaterial> {
    const [material] = await db.insert(rawMaterials).values(materialData).returning();
    return material;
  }

  // Quote request operations
  async getQuoteRequests(): Promise<QuoteRequest[]> {
    return await db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt));
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

  // Supplier quote operations
  async getSupplierQuotes(requestId: string): Promise<SupplierQuote[]> {
    return await db.select().from(supplierQuotes).where(eq(supplierQuotes.requestId, requestId));
  }

  async createSupplierQuote(quoteData: InsertSupplierQuote): Promise<SupplierQuote> {
    const [quote] = await db.insert(supplierQuotes).values(quoteData).returning();
    return quote;
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
}

export const storage = new DatabaseStorage();
