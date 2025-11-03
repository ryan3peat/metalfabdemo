# Essential Flavours Supplier Portal

## Project Overview
A comprehensive B2B supplier portal for Essential Flavours, an Australian flavour manufacturer. The portal facilitates quote request management, supplier relationships, and procurement workflows with role-based access control.

## Current Status: Module 2 Complete ✅

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
- Replit Auth integration (OpenID Connect) with login button
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

---

## Upcoming Modules

### Module 3: Supplier Management
- Supplier list with search/sort/filter
- Add/Edit supplier forms
- Bulk CSV import
- Supplier profile views with quote history
- Document repository for certificates

### Module 4: Quote Request Creation
- Multi-step form workflow
- Material autocomplete
- Supplier selection with filters
- Request templates
- Auto-generated RFQ numbers

### Module 5: Email Notifications
- Professional HTML email templates
- SendGrid integration
- Email tracking (open/click rates)
- Automated reminder emails
- Token-based authentication links

### Module 6: Supplier Quote Submission
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
Proceed to **Module 2: Authentication & User Management** when ready.
