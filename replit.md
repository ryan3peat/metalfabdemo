# Essential Flavours Supplier Portal

## Overview
The Essential Flavours Supplier Portal is a B2B platform designed for an Australian flavour manufacturer to streamline quote request management, enhance supplier relationships, and optimize procurement workflows. The portal features role-based access control and aims to improve efficiency in the procurement process.

## User Preferences
I want to use iterative development, with a focus on completing each module end-to-end before proceeding. I prefer detailed explanations of design choices and technical implementations. For email services, I prefer not to use Replit's SendGrid integration; instead, the system should be designed for easy migration to Microsoft Graph API or another dedicated email provider. I also prefer the use of Material Design principles for the UI/UX.

## System Architecture

### Tech Stack
-   **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI
-   **Backend:** Express.js, Node.js
-   **Database:** PostgreSQL (Neon) with Drizzle ORM
-   **Authentication:** Replit Auth (OpenID Connect)
-   **Storage:** Replit Object Storage
-   **Email:** Mock service with a planned migration path

### Design System
The portal adheres to Material Design principles, utilizing the Roboto font family. It features a professional B2B aesthetic, information-dense interfaces, consistent spacing, and an accessibility-first approach.

### Core Features and Implementations

#### Module 1-2: Database & Authentication (Completed)
-   **Database Schema:** Comprehensive schema including `users`, `suppliers`, `quote_requests`, `request_suppliers`, and `supplier_quotes` tables with defined enums and relationships. Material details are embedded directly in `quote_requests`.
-   **Authentication & User Management:** Dual authentication (Replit Auth and local username/password for admin testing), role-based access control (Admin, Supplier, Procurement), protected routes, and an Admin User Management interface. Includes robust security features like bcrypt hashing, rate limiting, and email normalization.

#### Module 3: Supplier Management (Completed)
-   **CRUD Operations:** Complete supplier management with API routes and UI for listing, creating, editing, and deleting suppliers.
-   **Multiple Email Support:** Extended supplier schema with `email2` field to support secondary contact emails. Suppliers can have up to two email addresses (primary and secondary).
-   **CSV Import:** Successfully imported 19 suppliers from CSV file with automatic email splitting for suppliers with multiple contacts.
-   **Data Validation:** Form validation ensures proper email format for both primary and secondary email fields.
-   **Critical Bug Fix:** Resolved incorrect parameter order in `apiRequest()` function. Changed signature from `(method, url, data)` to `(url, method, data)` to match intuitive usage pattern and fix delete operations.

#### Module 4-5: Quote Request Workflow (Completed)
-   **Quote Request Creation:** A 4-step multi-step wizard for creating quote requests, including material details, specifications, supplier selection, and review. Features draft saving, auto-generated RFQ numbers (RFQ-YYYY-XXXXX), and date handling.
-   **Email Notifications:** A mock email service with professional HTML templates for RFQ notifications, sending emails to selected suppliers with token-based authentication links for quote submission. Includes a secure 64-character random access token system with 30-day expiration.

#### Module 6: Supplier Quote Submission (Completed)
-   **Public Quote Submission Interface:** A token-based public page at `/quote-submission/:id?token=xxx` that allows suppliers to submit quotes without login. Features:
    -   Token validation middleware with automatic expiration checking (30-day validity)
    -   Quote request details display (material, quantity, specifications, deadline)
    -   Quote submission form with fields: price per unit, lead time, MOQ, payment terms, additional notes
    -   Currency support (AUD default)
    -   Success page with confirmation message
    -   Fully tested end-to-end workflow with E2E tests
-   **Critical Technical Fix:** Resolved frontend routing issue where wouter's `useLocation()` only returns pathname. Fixed by using `window.location.search` for query parameter extraction, enabling proper token validation on public routes.

#### Module 7: Quote Comparison & Review (Completed)
-   **Quote Request Detail Page:** Comprehensive detail page at `/quote-requests/:id` displaying:
    -   Summary cards showing: quotes received count (X/Y format), submit-by date, and best quote price
    -   Material details section compressed to 1 row with 4 columns: Material Name, Quantity, CAS Number, FEMA Number
    -   Supplier Quotes Comparison: 3-column card layout displaying top 3 quotes ordered by best price (lowest to highest)
    -   Each supplier card shows: Price per Unit (prominent), MOQ, Lead Time, Payment Terms, and "Select Quote" button
    -   Best price quote highlighted with primary border, background tint, and "Best Price" badge
-   **Enhanced API Endpoint:** Modified `GET /api/quote-requests/:id` to return joined data from `quote_requests`, `request_suppliers`, and `supplier_quotes` tables with complete quote information
-   **Quotes Received Column:** Added to Quote Requests list table showing "X / Y" format (quotes received / total suppliers) with green badge indicator when quotes are received
-   **Backend Optimization:** Implemented Set-based deduplication in `getQuoteRequests()` to accurately count unique suppliers and submitted quotes per request
-   **Critical Bug Fixes:** 
    -   Resolved foreign key constraint violation in `upsertUser()` method that occurred during OIDC login. Fix excludes the `id` field from update operations to prevent attempts to modify primary keys referenced by other tables.
    -   Fixed Create Supplier button by adding `createdBy` to `insertSupplierSchema` omit block, allowing frontend validation to pass without providing server-populated fields.

### System Design Choices
-   **Modular Development:** The project is built in modular phases, ensuring each feature set is complete and testable.
-   **Role-Based Access Control (RBAC):** Granular permissions for Admin, Supplier, and Procurement roles.
-   **Token-Based Supplier Access:** Enables frictionless quote submission for suppliers without requiring traditional login. Uses 64-character cryptographically random tokens with 30-day expiration.
-   **Auto-generated RFQ Numbers:** Consistent and trackable request numbering (format: RFQ-YYYY-XXXXX).
-   **Data Validation:** Extensive use of Zod for schema validation on the backend.
-   **Public vs Authenticated Routes:** Separate routing structure to render public pages (quote submission) without authentication layouts, while maintaining secure authenticated routes for internal users.

## External Dependencies
-   **PostgreSQL (Neon):** Primary database for data persistence.
-   **Replit Auth (OpenID Connect):** Used for user authentication.
-   **Replit Object Storage (Google Cloud Storage):** For file uploads.
-   **Microsoft Graph API:** Planned integration for official M365 email services (future).
-   **SendGrid:** Considered as an alternative email service provider (future).