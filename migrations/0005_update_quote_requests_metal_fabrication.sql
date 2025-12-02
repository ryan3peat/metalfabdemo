-- Add new columns for metal fabrication to quote_requests table
ALTER TABLE "quote_requests" 
  ADD COLUMN IF NOT EXISTS "material_type" "material_type",
  ADD COLUMN IF NOT EXISTS "thickness" numeric(10, 2),
  ADD COLUMN IF NOT EXISTS "dimensions" jsonb,
  ADD COLUMN IF NOT EXISTS "finish" "finish",
  ADD COLUMN IF NOT EXISTS "tolerance" text,
  ADD COLUMN IF NOT EXISTS "welding_requirements" text,
  ADD COLUMN IF NOT EXISTS "surface_treatment" text;

-- Drop old columns that are no longer needed for metal fabrication
-- Note: We'll keep material_name, material_grade, and material_notes as they're still useful
ALTER TABLE "quote_requests"
  DROP COLUMN IF EXISTS "cas_number",
  DROP COLUMN IF EXISTS "fema_number",
  DROP COLUMN IF EXISTS "material_form",
  DROP COLUMN IF EXISTS "material_origin",
  DROP COLUMN IF EXISTS "packaging_requirements";

