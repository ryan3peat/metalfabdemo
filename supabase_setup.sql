-- ============================================================================
-- Complete Database Setup Script for Metal Fabrication Supplier Portal
-- Run this in Supabase SQL Editor to set up your database
-- ============================================================================

-- Step 1: Create all ENUM types
CREATE TYPE "public"."category" AS ENUM('natural', 'synthetic', 'natural_identical');
CREATE TYPE "public"."document_type" AS ENUM('coa', 'pif', 'specification', 'sds', 'halal', 'kosher', 'natural_status', 'process_flow', 'gfsi_cert', 'organic');
CREATE TYPE "public"."form" AS ENUM('liquid', 'powder', 'paste');
CREATE TYPE "public"."magic_link_type" AS ENUM('login', 'password_setup');
CREATE TYPE "public"."quote_request_status" AS ENUM('draft', 'active', 'closed', 'cancelled');
CREATE TYPE "public"."quote_status" AS ENUM('submitted', 'accepted', 'rejected');
CREATE TYPE "public"."role" AS ENUM('admin', 'supplier', 'procurement');
CREATE TYPE "public"."preliminary_approval_status" AS ENUM('initial_submitted', 'pending_documentation', 'final_submitted', 'rejected');
CREATE TYPE "public"."document_request_status" AS ENUM('pending', 'completed');
CREATE TYPE "public"."notification_type" AS ENUM('quote_submitted', 'document_uploaded', 'documentation_complete');
CREATE TYPE "public"."material_type" AS ENUM('steel', 'aluminum', 'stainless_steel', 'copper', 'brass', 'bronze', 'titanium', 'other');
CREATE TYPE "public"."finish" AS ENUM('painted', 'powder_coated', 'anodized', 'galvanized', 'polished', 'brushed', 'raw', 'other');
CREATE TYPE "public"."supplier_application_status" AS ENUM('pending', 'approved', 'rejected');

-- Step 2: Create tables
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"email" varchar UNIQUE,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "public"."role" DEFAULT 'supplier' NOT NULL,
	"company_name" varchar,
	"password_hash" varchar(255),
	"password_set_at" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_name" varchar(255) NOT NULL,
	"contact_person" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email2" varchar(255),
	"phone" varchar(50),
	"location" text,
	"moq" text,
	"lead_times" text,
	"payment_terms" text,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "quote_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_number" varchar(50) NOT NULL UNIQUE,
	"material_name" varchar(255) NOT NULL,
	"material_type" "public"."material_type",
	"material_grade" varchar(100),
	"thickness" numeric(10, 2),
	"dimensions" jsonb,
	"finish" "public"."finish",
	"tolerance" text,
	"welding_requirements" text,
	"surface_treatment" text,
	"material_notes" text,
	"quantity_needed" numeric(10, 2) NOT NULL,
	"unit_of_measure" varchar(50) NOT NULL,
	"specifications" jsonb,
	"additional_specifications" text,
	"submit_by_date" timestamp NOT NULL,
	"status" "public"."quote_request_status" DEFAULT 'draft' NOT NULL,
	"find_new_suppliers" boolean DEFAULT false NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "request_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"access_token" varchar(64) UNIQUE,
	"token_expires_at" timestamp,
	"email_sent_at" timestamp,
	"email_opened_at" timestamp,
	"response_submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "supplier_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"price_per_unit" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'AUD' NOT NULL,
	"moq" text,
	"lead_time" text,
	"validity_date" timestamp,
	"payment_terms" text,
	"additional_notes" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"pack_size" text,
	"shipping_terms" text,
	"freight_cost" numeric(10, 2),
	"shelf_life" text,
	"storage_requirements" text,
	"dangerous_goods_handling" text,
	"preliminary_approval_status" "public"."preliminary_approval_status" DEFAULT 'initial_submitted' NOT NULL,
	"preliminary_approved_at" timestamp,
	"preliminary_approved_by" varchar,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"status" "public"."quote_status" DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "supplier_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_quote_id" uuid NOT NULL,
	"document_type" "public"."document_type" NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" numeric NOT NULL,
	"mime_type" varchar(100),
	"uploaded_by" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "document_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"requested_documents" jsonb NOT NULL,
	"requested_by" varchar NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"status" "public"."document_request_status" DEFAULT 'pending' NOT NULL,
	"email_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "public"."notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"related_quote_id" uuid,
	"related_request_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "magic_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token_hash" varchar(64) NOT NULL UNIQUE,
	"type" "public"."magic_link_type" DEFAULT 'login' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "supplier_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"abn" varchar(20),
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"postcode" varchar(20),
	"country" varchar(100) DEFAULT 'Australia',
	"contact_person" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"website" varchar(255),
	"services_offered" jsonb DEFAULT '[]'::jsonb,
	"specializations" jsonb DEFAULT '[]'::jsonb,
	"equipment" jsonb DEFAULT '[]'::jsonb,
	"material_types" jsonb DEFAULT '[]'::jsonb,
	"stock_levels" text,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"iso_certifications" jsonb DEFAULT '[]'::jsonb,
	"quality_processes" text,
	"quality_documentation" jsonb DEFAULT '[]'::jsonb,
	"welding_capabilities" jsonb DEFAULT '[]'::jsonb,
	"surface_treatment_options" jsonb DEFAULT '[]'::jsonb,
	"production_capacity" text,
	"lead_times" text,
	"equipment_list" jsonb DEFAULT '[]'::jsonb,
	"status" "public"."supplier_application_status" DEFAULT 'pending' NOT NULL,
	"application_date" timestamp DEFAULT now() NOT NULL,
	"review_date" timestamp,
	"reviewed_by" varchar,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Step 3: Add foreign key constraints
ALTER TABLE "quote_requests" 
	ADD CONSTRAINT "quote_requests_created_by_users_id_fk" 
	FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "request_suppliers" 
	ADD CONSTRAINT "request_suppliers_request_id_quote_requests_id_fk" 
	FOREIGN KEY ("request_id") REFERENCES "public"."quote_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "request_suppliers" 
	ADD CONSTRAINT "request_suppliers_supplier_id_suppliers_id_fk" 
	FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "supplier_quotes" 
	ADD CONSTRAINT "supplier_quotes_request_id_quote_requests_id_fk" 
	FOREIGN KEY ("request_id") REFERENCES "public"."quote_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "supplier_quotes" 
	ADD CONSTRAINT "supplier_quotes_supplier_id_suppliers_id_fk" 
	FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "supplier_quotes" 
	ADD CONSTRAINT "supplier_quotes_preliminary_approved_by_users_id_fk" 
	FOREIGN KEY ("preliminary_approved_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "supplier_documents" 
	ADD CONSTRAINT "supplier_documents_supplier_quote_id_supplier_quotes_id_fk" 
	FOREIGN KEY ("supplier_quote_id") REFERENCES "public"."supplier_quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "supplier_documents" 
	ADD CONSTRAINT "supplier_documents_uploaded_by_users_id_fk" 
	FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "document_requests" 
	ADD CONSTRAINT "document_requests_quote_id_supplier_quotes_id_fk" 
	FOREIGN KEY ("quote_id") REFERENCES "public"."supplier_quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "document_requests" 
	ADD CONSTRAINT "document_requests_requested_by_users_id_fk" 
	FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "notifications" 
	ADD CONSTRAINT "notifications_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "notifications" 
	ADD CONSTRAINT "notifications_related_quote_id_supplier_quotes_id_fk" 
	FOREIGN KEY ("related_quote_id") REFERENCES "public"."supplier_quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "notifications" 
	ADD CONSTRAINT "notifications_related_request_id_quote_requests_id_fk" 
	FOREIGN KEY ("related_request_id") REFERENCES "public"."quote_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "suppliers" 
	ADD CONSTRAINT "suppliers_created_by_users_id_fk" 
	FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "supplier_applications" 
	ADD CONSTRAINT "supplier_applications_reviewed_by_users_id_fk" 
	FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS "idx_magic_links_token_hash" ON "magic_links" USING btree ("token_hash");
CREATE INDEX IF NOT EXISTS "idx_magic_links_email" ON "magic_links" USING btree ("email");
CREATE INDEX IF NOT EXISTS "idx_magic_links_expires_at" ON "magic_links" USING btree ("expires_at");
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" USING btree ("expire");
CREATE INDEX IF NOT EXISTS "idx_supplier_documents_quote_id" ON "supplier_documents" USING btree ("supplier_quote_id");
CREATE INDEX IF NOT EXISTS "idx_document_requests_quote_id" ON "document_requests" USING btree ("quote_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_is_read" ON "notifications" USING btree ("is_read");
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "idx_supplier_applications_status" ON "supplier_applications" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_supplier_applications_email" ON "supplier_applications" USING btree ("email");

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup complete! All tables, enums, and indexes have been created.';
END $$;


