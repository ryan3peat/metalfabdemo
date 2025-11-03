# Essential Flavours Supplier Portal

## Project Overview
A comprehensive B2B supplier portal for Essential Flavours, an Australian flavour manufacturer. The portal facilitates quote request management, supplier relationships, and procurement workflows with role-based access control.

## Current Status: Module 5 Complete ✅

### Module 1: Database Schema & Foundation Setup
**Status:** ✅ Complete

**Implemented:**
- Complete database schema with 6 core tables:
  - `users` - User accounts with role-based access (admin, supplier, procurement) + active status
  - `suppliers` - Supplier directory with contact info, certifications, and capabilities
  - `raw_materials` - Materials catalog with CAS numbers, categories, and forms
  - `quote_requests` - RFQ management with auto-generated request numbers
  - `request_suppliers` - Junction table tracking email engagement + token-based access (accessToken, tokenExpiresAt)
  - `supplier_quotes` - Quote submissions with pricing and terms

- Authentication system using Replit Auth (OpenID Connect)
- PostgreSQL database with Drizzle ORM
- Object storage for file uploads
- Session management with database storage
- Complete storage layer with CRUD operations
- Type-safe schemas with Zod validation

**Database Enums:**
- Roles: `admin`, `supplier`, `procurement`
- Material Categories: `natural`, `synthetic`, `natural_identical`
- Material Forms: `liquid`, `powder`, `paste`
- Quote Request Status: `draft`, `active`, `closed`, `cancelled`
- Quote Status: `submitted`, `accepted`, `rejected`

**Relations Configured:**
- Users → Suppliers (created_by)
- Users → Quote Requests (created_by)
- Quote Requests → Raw Materials
- Quote Requests → Request Suppliers → Suppliers
- Quote Requests → Supplier Quotes → Suppliers

---

### Module 2: Authentication & User Management
**Status:** ✅ Complete

**Implemented:**
- Landing page for logged-out users with professional design following Material Design guidelines
- **Dual Authentication System:**
  - **Replit Auth (OIDC)**: Primary authentication for production use
  - **Local Username/Password**: Added for admin testing purposes (ryan@essentialflavours.com.au is a Microsoft account)
  - Seamless session management supporting both authentication methods
  - Admin allowlist for local auth (only specific emails can use password login)
- Role-based authentication and routing:
  - Admin/Procurement → Admin Dashboard
  - Supplier → Supplier Dashboard
- Protected routes with automatic redirection
- Admin User Management interface:
  - List all users with search/filter
  - Update user roles (admin, procurement, supplier)
  - Activate/deactivate user accounts
  - Permission checks (admin and procurement can manage users)
- Authentication utilities (`useAuth` hook, `authUtils.ts`)
- Role-based sidebar navigation
- Proper React component structure with QueryClientProvider
- Token-based quote submission support (accessToken fields in request_suppliers table)

**Pages Created:**
- `/` - Landing page (logged out) / Dashboard (logged in, role-based)
- `/users` - User Management (admin/procurement only)

**Security Features:**
- Session-based authentication with database persistence
- Role-based access control (RBAC)
- Protected API routes with authorization checks
- Token-based supplier access for frictionless quote submission
- **Password Security:**
  - bcrypt hashing with cost factor 12
  - Secure password storage (passwordHash never exposed in API responses)
  - Password set date tracking (passwordSetAt field)
- **Account Protection:**
  - Rate limiting: 5 failed login attempts trigger 15-minute lockout
  - Email normalization (lowercase + trim) to prevent case-sensitive bypass
  - Exponential backoff on failed attempts
  - Audit logging for all authentication events

**Admin Test Credentials:**
- Email: ryan@essentialflavours.com.au
- Password: Admin123!
- Note: Password can be set via /api/local/set-password endpoint

---

### Module 3: Supplier Management
**Status:** ⚠️ Partially Complete (Known Issue)

**Implemented:**
- Storage methods for supplier CRUD operations (already existed from Module 1)
- API routes with authentication and authorization:
  - GET /api/suppliers - List all suppliers
  - GET /api/suppliers/:id - Get supplier by ID
  - POST /api/suppliers - Create new supplier
  - PATCH /api/suppliers/:id - Update supplier
  - DELETE /api/suppliers/:id - Delete supplier
- Supplier list page (`/suppliers`) with:
  - Table view displaying all supplier details
  - Search functionality (filters by name, email, contact person)
  - Status filter (active/inactive)
  - Delete confirmation dialog
  - Empty state handling
- Add/Edit supplier dialog with all fields:
  - Required: Supplier Name, Contact Person, Email
  - Optional: Phone, Location, MOQ, Lead Times, Payment Terms
  - Certifications management (add/remove as badges)
  - Active status toggle
- Navigation integration in sidebar
- Role-based access (admin/procurement only)

**Known Issue:**
- **Form Submission Bug:** The supplier creation/edit form experiences validation failures preventing submission. Root cause appears to be a Zod schema mismatch between `createInsertSchema` generated validation and form data structure for optional fields. Multiple fix attempts made:
  - Converting empty strings to null for optional fields
  - Simplifying form schema extensions
  - Adding debug logging
- **Impact:** UI is complete and functional for viewing/searching suppliers, but creating/editing suppliers via the dialog is currently non-functional
- **Workaround:** Direct database manipulation or API testing tools can be used to manage suppliers until form issue is resolved
- **Next Steps:** Requires deep investigation of Drizzle-Zod schema generation for nullable fields

**Deferred Features (MVP not required):**
- Supplier detail/profile page with document management
- CSV bulk import functionality

**Pages Created:**
- `/suppliers` - Supplier Management (admin/procurement only)

**Security:**
- All routes protected with authentication middleware
- Role-based authorization (admin/procurement only)
- Input validation on backend using Zod schemas
- Cascading deletes for related supplier data

---

### Module 4: Quote Request Creation & History
**Status:** ✅ Complete

**Implemented:**
- **Database Schema Changes:**
  - Removed raw_materials table (user clarified: no separate materials catalog needed)
  - Embedded material details directly in quote_requests table:
    - materialName, casNumber, femaNumber, materialCategory, materialForm
    - materialGrade, materialOrigin (optional fields)
  - Updated schema to support draft/active workflows

- **Quote Request Creation Wizard:**
  - 4-step multi-step form workflow:
    1. **Material Details** - Name, CAS number, FEMA, category, form, grade, origin
    2. **Specifications** - Quantity, unit, submit-by date, additional specs
    3. **Supplier Selection** - Select from existing suppliers OR "find new suppliers"
    4. **Review & Submit** - Summary review before submission
  - Step-by-step validation with visual progress indicators
  - Allows draft saving at any step (bypasses strict validation)
  - Allows submission with EITHER selected suppliers OR "find new suppliers" enabled
  - Auto-generates RFQ numbers (format: RFQ-YYYY-XXXXX with zero-padded sequential number)
  - Date picker integration with proper date handling
  - Form state persistence across wizard steps

- **Quote Requests List/History Page:**
  - Table view with all quote request details
  - Status badges (draft/active/closed/cancelled) with color coding
  - Search functionality (filters by request number, material name)
  - Status filter dropdown
  - Date range filtering (created date)
  - Sort by creation date (newest first)
  - View/Edit functionality (future enhancement)
  - Empty state handling with call-to-action

- **API Routes:**
  - POST /api/quote-requests - Create active quote request
  - POST /api/quote-requests/draft - Save draft with relaxed validation
  - GET /api/quote-requests - List all quote requests with filters
  - GET /api/quote-requests/:id - Get single quote request
  - Date conversion handling (ISO strings → Date objects for DB insertion)
  - Request-supplier relationship creation
  - RFQ number generation with year-based sequencing

- **Bug Fixes:**
  - Fixed validation to allow "find new suppliers" without selecting existing suppliers
  - Fixed draft save to bypass strict field validation
  - Fixed date conversion bug (submitByDate ISO string → Date object)
  - Validated end-to-end workflow with playwright tests

**Pages Created:**
- `/quote-requests` - Quote Requests List/History (admin/procurement only)
- `/quote-requests/create` - Multi-step Quote Request Creation Wizard (admin/procurement only)

**Security:**
- All routes protected with authentication middleware
- Role-based authorization (admin/procurement only)
- Input validation using Zod schemas with draft/active schema variants
- Data sanitization and type conversion

**Testing:**
- End-to-end playwright test passed successfully
- Validated full workflow: login → navigation → wizard → submission → list view
- Verified RFQ number generation (RFQ-2025-00001)
- Confirmed date handling and database insertion

---

### Module 5: Email Notifications
**Status:** ✅ Complete (Mock Implementation)

**Implemented:**
- **Mock Email Service:**
  - Professional HTML email templates for RFQ notifications
  - Email service utility (`server/email/emailService.ts`)
  - Console logging instead of actual email sending (for development)
  - Easy migration path to real email providers

- **Email Integration:**
  - Automatic email sending when quote requests are created
  - Emails sent to all selected suppliers with RFQ details
  - Token-based authentication links for quote submission
  - Email tracking in database (emailSentAt timestamp)

- **Security Token System:**
  - Secure 64-character random access tokens generated for each supplier
  - 30-day token expiration
  - Unique tokens per supplier per request
  - Token-based quote submission URLs (no login required)

- **Email Template Features:**
  - Professional B2B design matching Material Design guidelines
  - Includes: Request number, material details, quantity, deadline
  - Clear call-to-action button for quote submission
  - Responsive HTML design
  - Essential Flavours branding

- **Database Updates:**
  - Added `updateRequestSupplier` method to storage layer
  - Email tracking fields already in schema (emailSentAt, accessToken, tokenExpiresAt)
  - Proper timestamp recording for sent emails

**Mock Implementation Details:**
- Emails logged to console with full details
- Token and submission URL displayed in logs
- All email metadata tracked in database
- Ready for production email provider integration

**Future Migration Path:**
- **Option 1 (Recommended):** Microsoft Graph API integration for official M365 emails
- **Option 2:** SendGrid with domain authentication
- **Option 3:** SMTP relay via Microsoft 365

**Testing:**
- Mock emails logged successfully during quote request creation
- Access tokens generated and stored correctly
- Email tracking timestamps recorded in database

**Note:** No Replit SendGrid integration used per user preference. System designed for easy migration to Microsoft Graph API when ready for production.

---

## Upcoming Modules

### Module 6: Supplier Quote Submission (Next)
- Public quote submission interface (token-based)
- File upload for COA/specifications
- Quote history for suppliers
- Company profile management

### Module 7: Admin Dashboard
- Statistics widgets
- Request management table
- Quote comparison view
- Analytics and reporting
- Price trend charts

### Module 8: Additional Features
- Document management system
- Audit trail logging
- Excel/CSV export
- Mobile-responsive design
- GDPR compliance features

### Module 9: Testing & Deployment
- E2E testing
- Security audit
- Performance optimization
- User training materials
- Production deployment

---

## Architecture

### Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (Neon) via Drizzle ORM
- **Authentication:** Replit Auth (OpenID Connect)
- **Storage:** Replit Object Storage (Google Cloud Storage)
- **Email:** SendGrid (planned for Module 5)

### Design System
Following Material Design principles with:
- Roboto font family (sans and mono variants)
- Professional B2B aesthetic
- Information-dense interfaces
- Consistent spacing (4/6/8/12 units)
- Accessibility-first approach

### Key Features
- Role-based access control (RBAC)
- Token-based supplier access (no login required for quote submission)
- Auto-generated RFQ numbers (format: RFQ-YYYY-XXXXX)
- Email engagement tracking
- File upload support for certifications and quotes
- Real-time quote comparison
- Audit trail for all actions

---

## Development Approach
Building in modular phases, completing each module end-to-end before proceeding to the next. Each module represents a complete, testable feature set.

---

## User Roles

### Admin (Essential Flavours Procurement Team)
- Full CRUD on suppliers
- Create/edit/delete quote requests
- View all quotes and analytics
- Export data to Excel/CSV
- Manage user accounts

### Supplier
- View requests sent to them
- Submit quotes (via email link, no login required initially)
- Update company profile (when logged in)
- View quote history

### Procurement
- Similar to admin but may have restricted permissions
- Focused on operational workflows

---

## Next Steps
Proceed to **Module 4: Quote Request Creation** (Module 3 form submission issue documented as known issue).
