import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  numeric,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const roleEnum = pgEnum('role', ['admin', 'supplier', 'procurement']);
export const categoryEnum = pgEnum('category', ['natural', 'synthetic', 'natural_identical']);
export const formEnum = pgEnum('form', ['liquid', 'powder', 'paste']);
export const quoteRequestStatusEnum = pgEnum('quote_request_status', ['draft', 'active', 'closed', 'cancelled']);
export const quoteStatusEnum = pgEnum('quote_status', ['submitted', 'accepted', 'rejected']);

// ============================================================================
// TABLE DEFINITIONS
// ============================================================================

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (extended for Replit Auth + supplier portal needs)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: roleEnum("role").notNull().default('supplier'),
  companyName: varchar("company_name"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierName: varchar("supplier_name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  location: text("location"),
  moq: text("moq"),
  leadTimes: text("lead_times"),
  paymentTerms: text("payment_terms"),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  active: boolean("active").default(true).notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Raw materials table
export const rawMaterials = pgTable("raw_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  materialName: varchar("material_name", { length: 255 }).notNull(),
  casNumber: varchar("cas_number", { length: 50 }).notNull(),
  femaNumber: varchar("fema_number", { length: 50 }),
  description: text("description"),
  category: categoryEnum("category").notNull(),
  form: formEnum("form").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Quote requests table
export const quoteRequests = pgTable("quote_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestNumber: varchar("request_number", { length: 50 }).notNull().unique(),
  rawMaterialId: uuid("raw_material_id").notNull().references(() => rawMaterials.id),
  quantityNeeded: numeric("quantity_needed", { precision: 10, scale: 2 }).notNull(),
  unitOfMeasure: varchar("unit_of_measure", { length: 50 }).notNull(),
  specifications: jsonb("specifications").$type<{
    purity?: string;
    grade?: string;
    origin?: string;
    additionalSpecs?: string;
  }>(),
  submitByDate: timestamp("submit_by_date").notNull(),
  status: quoteRequestStatusEnum("status").notNull().default('draft'),
  findNewSuppliers: boolean("find_new_suppliers").default(false).notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Request suppliers junction table
export const requestSuppliers = pgTable("request_suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => quoteRequests.id, { onDelete: 'cascade' }),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  accessToken: varchar("access_token", { length: 64 }).unique(),
  tokenExpiresAt: timestamp("token_expires_at"),
  emailSentAt: timestamp("email_sent_at"),
  emailOpenedAt: timestamp("email_opened_at"),
  responseSubmittedAt: timestamp("response_submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Supplier quotes table
export const supplierQuotes = pgTable("supplier_quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => quoteRequests.id, { onDelete: 'cascade' }),
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default('AUD'),
  moq: text("moq"),
  leadTime: text("lead_time"),
  validityDate: timestamp("validity_date"),
  paymentTerms: text("payment_terms"),
  additionalNotes: text("additional_notes"),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  status: quoteStatusEnum("status").notNull().default('submitted'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  suppliersCreated: many(suppliers),
  quoteRequestsCreated: many(quoteRequests),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  creator: one(users, {
    fields: [suppliers.createdBy],
    references: [users.id],
  }),
  requestSuppliers: many(requestSuppliers),
  supplierQuotes: many(supplierQuotes),
}));

export const rawMaterialsRelations = relations(rawMaterials, ({ many }) => ({
  quoteRequests: many(quoteRequests),
}));

export const quoteRequestsRelations = relations(quoteRequests, ({ one, many }) => ({
  rawMaterial: one(rawMaterials, {
    fields: [quoteRequests.rawMaterialId],
    references: [rawMaterials.id],
  }),
  creator: one(users, {
    fields: [quoteRequests.createdBy],
    references: [users.id],
  }),
  requestSuppliers: many(requestSuppliers),
  supplierQuotes: many(supplierQuotes),
}));

export const requestSuppliersRelations = relations(requestSuppliers, ({ one }) => ({
  request: one(quoteRequests, {
    fields: [requestSuppliers.requestId],
    references: [quoteRequests.id],
  }),
  supplier: one(suppliers, {
    fields: [requestSuppliers.supplierId],
    references: [suppliers.id],
  }),
}));

export const supplierQuotesRelations = relations(supplierQuotes, ({ one }) => ({
  request: one(quoteRequests, {
    fields: [supplierQuotes.requestId],
    references: [quoteRequests.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierQuotes.supplierId],
    references: [suppliers.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertSupplier = typeof suppliers.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;

export type InsertRawMaterial = typeof rawMaterials.$inferInsert;
export type RawMaterial = typeof rawMaterials.$inferSelect;

export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;
export type QuoteRequest = typeof quoteRequests.$inferSelect;

export type InsertRequestSupplier = typeof requestSuppliers.$inferInsert;
export type RequestSupplier = typeof requestSuppliers.$inferSelect;

export type InsertSupplierQuote = typeof supplierQuotes.$inferInsert;
export type SupplierQuote = typeof supplierQuotes.$inferSelect;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const insertSupplierSchema = createInsertSchema(suppliers, {
  email: z.string().email(),
  supplierName: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRawMaterialSchema = createInsertSchema(rawMaterials, {
  materialName: z.string().min(1, "Material name is required"),
  casNumber: z.string().min(1, "CAS number is required"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests, {
  quantityNeeded: z.string().min(1, "Quantity is required"),
  unitOfMeasure: z.string().min(1, "Unit of measure is required"),
  submitByDate: z.date(),
}).omit({
  id: true,
  requestNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierQuoteSchema = createInsertSchema(supplierQuotes, {
  pricePerUnit: z.string().min(1, "Price is required"),
}).omit({
  id: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
});
