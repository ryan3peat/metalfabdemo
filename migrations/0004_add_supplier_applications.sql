-- Create enums for supplier applications
DO $$ BEGIN
 CREATE TYPE "material_type" AS ENUM('steel', 'aluminum', 'stainless_steel', 'copper', 'brass', 'bronze', 'titanium', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "finish" AS ENUM('painted', 'powder_coated', 'anodized', 'galvanized', 'polished', 'brushed', 'raw', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "supplier_application_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create supplier_applications table
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
	"status" "supplier_application_status" DEFAULT 'pending' NOT NULL,
	"application_date" timestamp DEFAULT now() NOT NULL,
	"review_date" timestamp,
	"reviewed_by" varchar REFERENCES "users"("id"),
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_supplier_applications_status" ON "supplier_applications" ("status");
CREATE INDEX IF NOT EXISTS "idx_supplier_applications_email" ON "supplier_applications" ("email");

