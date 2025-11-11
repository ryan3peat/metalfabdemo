-- Production Database Migration: Add document_requests table
-- Generated: 2025-11-11
-- Instructions: Execute this in your Production database via the Replit Database tool

-- Step 1: Create the enum for document request status
CREATE TYPE "public"."document_request_status" AS ENUM('pending', 'completed');

-- Step 2: Create the document_requests table
CREATE TABLE "document_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "quote_id" uuid NOT NULL,
    "requested_documents" jsonb NOT NULL,
    "requested_by" varchar NOT NULL,
    "requested_at" timestamp DEFAULT now() NOT NULL,
    "status" "document_request_status" DEFAULT 'pending' NOT NULL,
    "email_sent_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Step 3: Add foreign key constraints
ALTER TABLE "document_requests" 
    ADD CONSTRAINT "document_requests_quote_id_supplier_quotes_id_fk" 
    FOREIGN KEY ("quote_id") REFERENCES "public"."supplier_quotes"("id") 
    ON DELETE cascade ON UPDATE no action;

ALTER TABLE "document_requests" 
    ADD CONSTRAINT "document_requests_requested_by_users_id_fk" 
    FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") 
    ON DELETE no action ON UPDATE no action;

-- Step 4: Create index for performance
CREATE INDEX "idx_document_requests_quote_id" ON "document_requests" USING btree ("quote_id");

-- Migration complete!
