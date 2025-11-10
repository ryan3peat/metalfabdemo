# Essential Flavours Supplier Portal

## Overview
The Essential Flavours Supplier Portal is a B2B platform for an Australian flavour manufacturer. Its primary purpose is to streamline quote request management, enhance supplier relationships, and optimize procurement workflows. The portal incorporates role-based access control and aims to significantly improve efficiency in the procurement process.

## User Preferences
I want to use iterative development, with a focus on completing each module end-to-end before proceeding. I prefer detailed explanations of design choices and technical implementations. For email services, I prefer not to use Replit's SendGrid integration; instead, the system should be designed for easy migration to Microsoft Graph API or another dedicated email provider. I also prefer the use of Material Design principles for the UI/UX.

## System Architecture

### Tech Stack
-   **Frontend:** React, TypeScript, Tailwind CSS, Shadcn UI
-   **Backend:** Express.js, Node.js
-   **Database:** PostgreSQL (Neon) with Drizzle ORM
-   **Authentication:** Magic Link (passwordless email) for suppliers, local password authentication for admins
-   **Storage:** Replit Object Storage
-   **Email:** Microsoft Graph API (Outlook/M365) with HybridEmailService orchestrator

### Design System
The portal adheres to Material Design principles, utilizing the Roboto font family. It features a professional B2B aesthetic, information-dense interfaces, consistent spacing, and an accessibility-first approach.

### Core Features
-   **Database & Authentication:** Comprehensive schema, dual authentication system (Magic Link for suppliers, local password for admins), role-based access control (Admin, Supplier, Procurement), and Admin User Management.
-   **Simplified Landing Page:** Clean, professional login page with "Essential Flavours" title and "Supplier Quotation Portal" subtitle. Features separate login flows:
    -   **Supplier Login:** Main centered button using Magic Link passwordless authentication - sends secure email link for one-click login. Only registered suppliers can access the portal. Shows generic success messages to prevent email enumeration.
    -   **Admin Login:** Top-right button opening a dialog for local password authentication - credentials managed by admin users
-   **Admin Dashboard:** Live statistics dashboard displaying Active Requests, Total Suppliers, Pending Quotes, and Average Response Time with efficient SQL aggregations. Includes Recent Quote Requests section with clickable links.
-   **Supplier Management:** CRUD operations for suppliers, support for multiple email contacts, and CSV import functionality.
-   **Quote Request Workflow:** A 4-step multi-step wizard for creating quote requests, including material details, specifications, supplier selection, and review. Features draft saving and auto-generated RFQ numbers.
-   **Email Notifications:** Professional HTML email templates for RFQ notifications, sent to selected suppliers with secure token-based authentication links for quote submission via Microsoft Graph API.
-   **Public Quote Submission Interface:** Token-based public page for suppliers to submit quotes without login, featuring token validation, quote request details, and submission form.
-   **Quote Comparison & Review:** Comprehensive detail page for quote requests displaying summaries, material details, and a comparison of supplier quotes with highlighting for the best price. Includes a "Quotes Received" tracker.
-   **Authenticated Supplier Portal:** Extended database schema for product and shipping details, a `supplier_documents` table for post-approval uploads, dedicated supplier authentication middleware, and API endpoints. Features a tabbed dashboard UI, an enhanced quote submission form, and dedicated navigation.
-   **Dual-Access Portal Migration Features:** Promotion of the authenticated portal on token-based success pages and in RFQ emails. All new users default to 'supplier' role; admins must manually promote users to admin/procurement roles via User Management.

### System Design Choices
-   **Modular Development:** Project developed in modular phases for completeness and testability.
-   **Role-Based Access Control (RBAC):** Granular permissions for Admin, Supplier, and Procurement roles.
-   **Magic Link Authentication:** Passwordless email authentication for suppliers with SHA-256 hashed tokens, 15-minute expiration, single-use enforcement, and rate limiting (10 req/15min per IP, 3 req/5min per email). Generic success messages prevent email enumeration.
-   **Token-Based Quote Submission:** Frictionless quote submission for suppliers via secure, expiring tokens in RFQ notification emails.
-   **Dual Authentication Model:** Magic Link for suppliers, local password authentication for admins/procurement staff.
-   **Auto-generated RFQ Numbers:** Consistent `RFQ-YYYY-XXXXX` numbering.
-   **Data Validation:** Extensive backend schema validation using Zod.
-   **Public vs. Authenticated Routes:** Separate routing structures for secure and public access.

## External Dependencies
-   **PostgreSQL (Neon):** Primary database.
-   **Replit Object Storage:** For file uploads.
-   **Microsoft Graph API:** Production email service for magic links and RFQ notifications.

## Recent Changes (November 10, 2025)
-   **Magic Link Authentication:** Implemented passwordless email authentication for suppliers to replace Replit Auth requirement. Suppliers now receive one-click login links via email with enhanced security:
    -   SHA-256 token hashing (no plaintext storage)
    -   32-byte random tokens (crypto.randomBytes)
    -   15-minute expiration with single-use enforcement
    -   Rate limiting: 10 requests/15min per IP, 3 requests/5min per email
    -   Generic success messages to prevent email enumeration
    -   Opportunistic cleanup of expired tokens
-   **Database Schema:** Added `magic_links` table without userId field (email lookup at verification time)
-   **Email Integration:** Magic link emails sent via Microsoft Graph API with professional HTML templates
-   **UX Improvements:** Simplified supplier login flow - no Replit account required, just email address
-   **Removed Replit Auth:** Completely removed OIDC/Replit Auth integration - admins now use local password authentication only
    -   Removed openid-client dependency
    -   Simplified authentication middleware
    -   Unified logout endpoint (POST /api/logout) for all auth types
    -   Renamed replitAuth.ts to auth.ts for clarity