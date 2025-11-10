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
-   **Authentication:** Replit Auth (OpenID Connect)
-   **Storage:** Replit Object Storage
-   **Email:** Microsoft Graph API (Outlook/M365) with HybridEmailService orchestrator

### Design System
The portal adheres to Material Design principles, utilizing the Roboto font family. It features a professional B2B aesthetic, information-dense interfaces, consistent spacing, and an accessibility-first approach.

### Core Features
-   **Database & Authentication:** Comprehensive schema, dual authentication (Replit Auth and local), role-based access control (Admin, Supplier, Procurement), and Admin User Management.
-   **Simplified Landing Page:** Clean, professional login page with "Essential Flavours" title and "Supplier Quotation Portal" subtitle. Features separate login flows:
    -   **Supplier Login:** Main centered button using Replit Auth (OIDC) - validates user email against supplier database before granting access. Only registered suppliers can access the portal. Shows informative error messages for unregistered users.
    -   **Admin Login:** Top-right button opening a dialog for local authentication - allowlisted emails only for full system access
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
-   **Supplier Email Verification:** Only users with emails registered in the supplier database can access the portal via Replit Auth. Unregistered users receive clear error messages.
-   **Token-Based Supplier Access:** Frictionless quote submission for suppliers via secure, expiring tokens.
-   **Dual-Access Supplier Model:** Supports both token-based and authenticated portal access for suppliers.
-   **Auto-generated RFQ Numbers:** Consistent `RFQ-YYYY-XXXXX` numbering.
-   **Data Validation:** Extensive backend schema validation using Zod.
-   **Public vs. Authenticated Routes:** Separate routing structures for secure and public access.

## External Dependencies
-   **PostgreSQL (Neon):** Primary database.
-   **Replit Auth (OpenID Connect):** User authentication.
-   **Replit Object Storage:** For file uploads.
-   **Microsoft Graph API:** Production email service for sending RFQ notifications.