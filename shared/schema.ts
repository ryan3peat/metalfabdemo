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
export const materialTypeEnum = pgEnum('material_type', ['steel', 'aluminum', 'stainless_steel', 'copper', 'brass', 'bronze', 'titanium', 'other']);
export const finishEnum = pgEnum('finish', ['painted', 'powder_coated', 'anodized', 'galvanized', 'polished', 'brushed', 'raw', 'other']);
export const supplierApplicationStatusEnum = pgEnum('supplier_application_status', ['pending', 'approved', 'rejected']);
export const quoteStatusEnum = pgEnum('quote_status', ['submitted', 'accepted', 'rejected']);
// Updated quote status enum to reflect the new workflow
export const preliminaryApprovalStatusEnum = pgEnum('preliminary_approval_status', [
  'initial_submitted',      // Supplier has submitted initial quote
  'pending_documentation',  // Admin has requested additional documents
  'final_submitted',        // All documentation complete
  'rejected'                // Quote was rejected
]);
export const magicLinkTypeEnum = pgEnum('magic_link_type', ['login', 'password_setup']);
export const documentTypeEnum = pgEnum('document_type', [
  'coa',
  'pif',
  'specification',
  'sds',
  'halal',
  'kosher',
  'natural_status',
  'process_flow',
  'gfsi_cert',
  'organic'
]);
export const documentRequestStatusEnum = pgEnum('document_request_status', ['pending', 'completed']);
export const notificationTypeEnum = pgEnum('notification_type', [
  'quote_submitted',        // When a supplier submits a new quote
  'document_uploaded',      // When a supplier uploads a document
  'documentation_complete'  // When all requested documents are uploaded
]);

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

// Users table (extended for Replit Auth + supplier portal needs + local auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: roleEnum("role").notNull().default('supplier'),
  companyName: varchar("company_name"),
  passwordHash: varchar("password_hash", { length: 255 }),
  passwordSetAt: timestamp("password_set_at"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Magic links table (for passwordless authentication and password setup)
export const magicLinks = pgTable("magic_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  type: magicLinkTypeEnum("type").notNull().default('login'),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_magic_links_token_hash").on(table.tokenHash),
  index("idx_magic_links_email").on(table.email),
  index("idx_magic_links_expires_at").on(table.expiresAt),
]);

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierName: varchar("supplier_name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  email2: varchar("email2", { length: 255 }),
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

// Quote requests table (with embedded material details for metal fabrication)
export const quoteRequests = pgTable("quote_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestNumber: varchar("request_number", { length: 50 }).notNull().unique(),
  
  // Metal fabrication material details
  materialName: varchar("material_name", { length: 255 }).notNull(),
  materialType: materialTypeEnum("material_type"),
  materialGrade: varchar("material_grade", { length: 100 }),
  thickness: numeric("thickness", { precision: 10, scale: 2 }),
  dimensions: jsonb("dimensions").$type<{ length?: number; width?: number; height?: number }>(),
  finish: finishEnum("finish"),
  tolerance: text("tolerance"),
  weldingRequirements: text("welding_requirements"),
  surfaceTreatment: text("surface_treatment"),
  materialNotes: text("material_notes"),
  
  // Quote request details
  quantityNeeded: numeric("quantity_needed", { precision: 10, scale: 2 }).notNull(),
  unitOfMeasure: varchar("unit_of_measure", { length: 50 }).notNull(),
  specifications: jsonb("specifications").$type<Record<string, any>>(),
  additionalSpecifications: text("additional_specifications"),
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
  supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default('AUD'),
  moq: text("moq"),
  leadTime: text("lead_time"),
  validityDate: timestamp("validity_date"),
  paymentTerms: text("payment_terms"),
  additionalNotes: text("additional_notes"),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  
  // New fields for Module 9
  packSize: text("pack_size"),
  shippingTerms: text("shipping_terms"),
  freightCost: numeric("freight_cost", { precision: 10, scale: 2 }),
  shelfLife: text("shelf_life"),
  storageRequirements: text("storage_requirements"),
  dangerousGoodsHandling: text("dangerous_goods_handling"),
  
  // Quote submission status workflow
  // initial_submitted: Supplier has submitted initial quote (awaiting admin review)
  // pending_documentation: Admin has requested additional documents from supplier
  // final_submitted: All documentation complete (ready for final decision)
  // rejected: Quote was rejected by admin
  preliminaryApprovalStatus: preliminaryApprovalStatusEnum("preliminary_approval_status").notNull().default('initial_submitted'),
  preliminaryApprovedAt: timestamp("preliminary_approved_at"),
  preliminaryApprovedBy: varchar("preliminary_approved_by").references(() => users.id),
  
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  status: quoteStatusEnum("status").notNull().default('submitted'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Supplier documents table (for post-preliminary approval document uploads)
export const supplierDocuments = pgTable("supplier_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierQuoteId: uuid("supplier_quote_id").notNull().references(() => supplierQuotes.id, { onDelete: 'cascade' }),
  documentType: documentTypeEnum("document_type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: numeric("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_supplier_documents_quote_id").on(table.supplierQuoteId),
]);

// Document requests table (tracks which documents admin/procurement requested from supplier)
export const documentRequests = pgTable("document_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id").notNull().references(() => supplierQuotes.id, { onDelete: 'cascade' }),
  requestedDocuments: jsonb("requested_documents").$type<string[]>().notNull(),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  status: documentRequestStatusEnum("status").notNull().default('pending'),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_document_requests_quote_id").on(table.quoteId),
]);

// Notifications table (for in-app notifications to admin/procurement users)
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedQuoteId: uuid("related_quote_id").references(() => supplierQuotes.id, { onDelete: 'cascade' }),
  relatedRequestId: uuid("related_request_id").references(() => quoteRequests.id, { onDelete: 'cascade' }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_user_id").on(table.userId),
  index("idx_notifications_is_read").on(table.isRead),
  index("idx_notifications_created_at").on(table.createdAt),
]);

// Supplier applications table (for onboarding new suppliers)
export const supplierApplications = pgTable("supplier_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Company Information
  companyName: varchar("company_name", { length: 255 }).notNull(),
  abn: varchar("abn", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postcode: varchar("postcode", { length: 20 }),
  country: varchar("country", { length: 100 }).default('Australia'),
  contactPerson: varchar("contact_person", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  
  // Capabilities
  servicesOffered: jsonb("services_offered").$type<string[]>().default([]),
  specializations: jsonb("specializations").$type<string[]>().default([]),
  equipment: jsonb("equipment").$type<string[]>().default([]),
  
  // Materials & Stock
  materialTypes: jsonb("material_types").$type<string[]>().default([]),
  stockLevels: text("stock_levels"),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  
  // Quality Management
  isoCertifications: jsonb("iso_certifications").$type<string[]>().default([]),
  qualityProcesses: text("quality_processes"),
  qualityDocumentation: jsonb("quality_documentation").$type<string[]>().default([]),
  
  // Welding & Surface Treatment
  weldingCapabilities: jsonb("welding_capabilities").$type<string[]>().default([]),
  surfaceTreatmentOptions: jsonb("surface_treatment_options").$type<string[]>().default([]),
  
  // Capacity
  productionCapacity: text("production_capacity"),
  leadTimes: text("lead_times"),
  equipmentList: jsonb("equipment_list").$type<string[]>().default([]),
  
  // Status
  status: supplierApplicationStatusEnum("status").notNull().default('pending'),
  applicationDate: timestamp("application_date").defaultNow().notNull(),
  reviewDate: timestamp("review_date"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_supplier_applications_status").on(table.status),
  index("idx_supplier_applications_email").on(table.email),
]);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  suppliersCreated: many(suppliers),
  quoteRequestsCreated: many(quoteRequests),
  notifications: many(notifications),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  creator: one(users, {
    fields: [suppliers.createdBy],
    references: [users.id],
  }),
  requestSuppliers: many(requestSuppliers),
  supplierQuotes: many(supplierQuotes),
}));

export const quoteRequestsRelations = relations(quoteRequests, ({ one, many }) => ({
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

export const supplierQuotesRelations = relations(supplierQuotes, ({ one, many }) => ({
  request: one(quoteRequests, {
    fields: [supplierQuotes.requestId],
    references: [quoteRequests.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierQuotes.supplierId],
    references: [suppliers.id],
  }),
  documents: many(supplierDocuments),
  documentRequests: many(documentRequests),
}));

export const supplierDocumentsRelations = relations(supplierDocuments, ({ one }) => ({
  supplierQuote: one(supplierQuotes, {
    fields: [supplierDocuments.supplierQuoteId],
    references: [supplierQuotes.id],
  }),
  uploader: one(users, {
    fields: [supplierDocuments.uploadedBy],
    references: [users.id],
  }),
}));

export const documentRequestsRelations = relations(documentRequests, ({ one }) => ({
  quote: one(supplierQuotes, {
    fields: [documentRequests.quoteId],
    references: [supplierQuotes.id],
  }),
  requester: one(users, {
    fields: [documentRequests.requestedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedQuote: one(supplierQuotes, {
    fields: [notifications.relatedQuoteId],
    references: [supplierQuotes.id],
  }),
  relatedRequest: one(quoteRequests, {
    fields: [notifications.relatedRequestId],
    references: [quoteRequests.id],
  }),
}));

export const supplierApplicationsRelations = relations(supplierApplications, ({ one }) => ({
  reviewer: one(users, {
    fields: [supplierApplications.reviewedBy],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertMagicLink = typeof magicLinks.$inferInsert;
export type MagicLink = typeof magicLinks.$inferSelect;

export type InsertSupplier = typeof suppliers.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;

export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;
export type QuoteRequest = typeof quoteRequests.$inferSelect;

export type InsertRequestSupplier = typeof requestSuppliers.$inferInsert;
export type RequestSupplier = typeof requestSuppliers.$inferSelect;

export type InsertSupplierQuote = typeof supplierQuotes.$inferInsert;
export type SupplierQuote = typeof supplierQuotes.$inferSelect;

export type InsertSupplierDocument = typeof supplierDocuments.$inferInsert;
export type SupplierDocument = typeof supplierDocuments.$inferSelect;

export type InsertDocumentRequest = typeof documentRequests.$inferInsert;
export type DocumentRequest = typeof documentRequests.$inferSelect;

export type InsertNotification = typeof notifications.$inferInsert;
export type Notification = typeof notifications.$inferSelect;

export type InsertSupplierApplication = typeof supplierApplications.$inferInsert;
export type SupplierApplication = typeof supplierApplications.$inferSelect;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(['admin', 'supplier', 'procurement']),
  active: z.boolean().default(true),
}).omit({
  id: true,
  passwordHash: true,
  passwordSetAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers, {
  email: z.string().email(),
  email2: z.string().email().optional().or(z.literal('')),
  supplierName: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  certifications: z.array(z.string()).default([]),
}).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests, {
  materialName: z.string().min(1, "Material name is required"),
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
  pricePerUnit: z.coerce.number().positive("Price must be greater than 0"),
  packSize: z.string().optional(),
  shippingTerms: z.string().optional(),
  freightCost: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? undefined : Number(val),
    z.number().positive("Freight cost must be greater than 0").optional()
  ),
  validityDate: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (val instanceof Date) return val;
      return new Date(val as string);
    },
    z.date().optional()
  ),
  shelfLife: z.string().optional(),
  storageRequirements: z.string().optional(),
  dangerousGoodsHandling: z.string().optional(),
}).omit({
  id: true,
  requestId: true, // Added by backend after validation
  supplierId: true, // Added by backend middleware
  submittedAt: true,
  status: true, // Auto-set to 'submitted'
  preliminaryApprovalStatus: true,
  preliminaryApprovedAt: true,
  preliminaryApprovedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierDocumentSchema = createInsertSchema(supplierDocuments, {
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.string().min(1, "File size is required"),
}).omit({
  id: true,
  uploadedBy: true,
  uploadedAt: true,
  createdAt: true,
});

export const insertDocumentRequestSchema = createInsertSchema(documentRequests, {
  requestedDocuments: z.array(z.enum([
    'coa',
    'pif',
    'specification',
    'sds',
    'halal',
    'kosher',
    'natural_status',
    'process_flow',
    'gfsi_cert',
    'organic'
  ])).min(1, "At least one document must be selected"),
}).omit({
  id: true,
  requestedBy: true,
  requestedAt: true,
  status: true,
  emailSentAt: true,
  createdAt: true,
});

export const insertSupplierApplicationSchema = createInsertSchema(supplierApplications, {
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Valid email is required"),
  servicesOffered: z.array(z.string()).default([]),
  specializations: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  materialTypes: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  isoCertifications: z.array(z.string()).default([]),
  qualityDocumentation: z.array(z.string()).default([]),
  weldingCapabilities: z.array(z.string()).default([]),
  surfaceTreatmentOptions: z.array(z.string()).default([]),
  equipmentList: z.array(z.string()).default([]),
}).omit({
  id: true,
  status: true,
  applicationDate: true,
  reviewDate: true,
  reviewedBy: true,
  reviewNotes: true,
  createdAt: true,
  updatedAt: true,
});
