<!-- 6ecfcfe0-9bf2-483f-b7f8-76734ce546f4 c8065cbf-b71c-4918-b448-f21688ed7538 -->
# Metal Fabrication Supplier Portal - Demo Transformation Plan

## Overview

Transform the existing Essential Flavours supplier portal into a sales demo for metal fabrication businesses in Australia. The demo will be publicly accessible (no authentication), include a comprehensive "Approve Supplier" onboarding module, and tailor quote requests for metal fabrication projects.

## Key Changes

### 1. Remove Authentication System

- **Files to modify:**
- `client/src/App.tsx` - Remove auth guards, allow public access to all routes
- `client/src/hooks/useAuth.ts` - Return mock authenticated user or skip auth checks
- `server/routes.ts` - Remove `isAuthenticated` middleware from all routes
- `server/auth.ts` - Keep structure but bypass authentication checks
- `client/src/pages/landing.tsx` - Remove login requirement, redirect to dashboard

- **Approach:** Create a demo mode that bypasses all authentication. All routes become publicly accessible. Mock user data for admin role to enable all features.

### 2. Add "Approve Supplier" Module

- **New database schema:**
- Create `supplier_applications` table in `shared/schema.ts` with fields:
- Company Info: name, ABN, address, contact details, website
- Capabilities: services offered, specializations (JSONB)
- Materials & Stock: material types, stock levels, certifications
- Quality Management: ISO certifications, quality processes
- Welding & Surface Treatment: welding capabilities, surface treatment options
- Capacity: production capacity, lead times, equipment list
- Status: pending, approved, rejected
- Application date, review date, reviewed by

- **New API routes in `server/routes.ts`:**
- `POST /api/supplier-applications` - Submit application
- `GET /api/supplier-applications` - List applications (admin)
- `GET /api/supplier-applications/:id` - Get application details
- `PATCH /api/supplier-applications/:id/status` - Approve/reject application
- `POST /api/supplier-applications/:id/approve` - Convert approved application to supplier

- **New frontend pages:**
- `client/src/pages/approve-supplier.tsx` - Multi-step form for supplier application
- `client/src/pages/supplier-applications.tsx` - Admin view of applications
- `client/src/pages/supplier-application-detail.tsx` - Review application details

- **Form sections:**

1. Company Information (name, ABN, address, contact)
2. Capabilities (services, specializations, equipment)
3. Materials & Stock (material types, stock levels, certifications)
4. Quality Management (ISO certs, quality processes, documentation)
5. Welding & Surface Treatment (welding types, surface treatments)
6. Capacity (production capacity, lead times, equipment inventory)

### 3. Tailor Quote Requests for Metal Fabrication

- **Modify `shared/schema.ts`:**
- Replace `casNumber`, `femaNumber`, `materialForm` enum with:
- `materialType` (steel, aluminum, stainless steel, etc.)
- `materialGrade` (keep but change options to metal grades)
- `thickness` (numeric)
- `dimensions` (length, width, height - JSONB)
- `finish` (painted, powder coated, anodized, etc.)
- `tolerance` (text)
- `weldingRequirements` (text)
- `surfaceTreatment` (text)
- Remove `packagingRequirements` (not relevant for metal)

- **Modify `client/src/pages/create-quote-request.tsx`:**
- Replace CAS/FEMA fields with metal-specific fields
- Update form labels and placeholders
- Change material form dropdown to material type dropdown
- Add fields for dimensions, thickness, finish, tolerance
- Update validation schema

- **Modify `client/src/pages/quote-submission.tsx`:**
- Simplify quote form (basic fields only as per requirements)
- Keep: price, lead time, payment terms, notes
- Remove complex fields like pack size, freight cost, shelf life

- **Update display components:**
- `client/src/pages/quote-request-detail.tsx` - Show metal-specific fields
- `client/src/pages/quote-detail.tsx` - Display metal fabrication context

### 4. Update Branding and Terminology

- **Replace "Essential Flavours" references:**
- Update all UI text to generic "Supplier Portal" or configurable company name
- Change "flavor/chemical" terminology to "metal fabrication"
- Update email templates (if used in demo)
- Update page titles and descriptions

- **Files to update:**
- All page components with company name
- `client/src/components/app-sidebar.tsx` - Update navigation labels
- Email service files (if emails are part of demo)

### 5. Simplify Quote Submission

- **Modify `client/src/pages/quote-submission.tsx`:**
- Reduce form to essential fields only:
- Price per unit (required)
- Lead time (required)
- Payment terms (optional)
- Additional notes (optional)
- Remove: MOQ, validity date, currency (default to AUD), pack size, freight cost, etc.

### 6. Database Migration

- **Create new migration:**
- Add `supplier_applications` table
- Modify `quote_requests` table (drop CAS/FEMA, add metal fields)
- Update enums for material types and finishes

## Implementation Order

1. Remove authentication (enable demo mode)
2. Update database schema for metal fabrication
3. Create Approve Supplier module (database, API, UI)
4. Update quote request forms for metal fabrication
5. Simplify quote submission form
6. Update branding and terminology
7. Test all flows end-to-end

## Files to Create/Modify

**New Files:**

- `client/src/pages/approve-supplier.tsx`
- `client/src/pages/supplier-applications.tsx`
- `client/src/pages/supplier-application-detail.tsx`
- `migrations/0004_add_supplier_applications.sql`
- `migrations/0005_update_quote_requests_metal_fabrication.sql`

**Modified Files:**

- `shared/schema.ts` - Add supplier_applications, update quote_requests
- `server/routes.ts` - Remove auth, add supplier application routes
- `server/auth.ts` - Bypass authentication
- `client/src/App.tsx` - Remove auth guards
- `client/src/hooks/useAuth.ts` - Return mock user
- `client/src/pages/create-quote-request.tsx` - Metal fabrication fields
- `client/src/pages/quote-submission.tsx` - Simplify form
- `client/src/pages/quote-request-detail.tsx` - Display metal fields
- `client/src/components/app-sidebar.tsx` - Add Approve Supplier link
- All pages with "Essential Flavours" branding

### To-dos

- [ ] Remove authentication system - bypass all auth checks, make routes publicly accessible, return mock admin user
- [ ] Update database schema: add supplier_applications table, modify quote_requests for metal fabrication (remove CAS/FEMA, add material type, thickness, dimensions, finish, etc.)
- [ ] Create API routes for supplier applications: submit, list, get details, approve/reject, convert to supplier
- [ ] Create Approve Supplier UI: multi-step form (Company Info, Capabilities, Materials & Stock, Quality Management, Welding & Surface Treatment, Capacity) and admin review pages
- [ ] Update quote request creation form for metal fabrication: replace CAS/FEMA with material type, thickness, dimensions, finish, tolerance, welding requirements
- [ ] Simplify quote submission form to basic fields only: price, lead time, payment terms, notes
- [ ] Update quote request detail and quote detail pages to display metal fabrication-specific fields
- [ ] Replace 'Essential Flavours' branding with generic 'Supplier Portal' throughout the application