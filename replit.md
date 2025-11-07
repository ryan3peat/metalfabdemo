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
-   **Supplier Management:** CRUD operations for suppliers, support for multiple email contacts, and CSV import functionality.
-   **Quote Request Workflow:** A 4-step multi-step wizard for creating quote requests, including material details, specifications, supplier selection, and review. Features draft saving and auto-generated RFQ numbers.
-   **Email Notifications:** Professional HTML email templates for RFQ notifications, sent to selected suppliers with secure token-based authentication links for quote submission via Microsoft Graph API.
-   **Public Quote Submission Interface:** Token-based public page for suppliers to submit quotes without login, featuring token validation, quote request details, and submission form.
-   **Quote Comparison & Review:** Comprehensive detail page for quote requests displaying summaries, material details, and a comparison of supplier quotes with highlighting for the best price. Includes a "Quotes Received" tracker.
-   **Authenticated Supplier Portal:** Extended database schema for product and shipping details, a `supplier_documents` table for post-approval uploads, dedicated supplier authentication middleware, and API endpoints. Features a tabbed dashboard UI, an enhanced quote submission form, and dedicated navigation.
-   **Dual-Access Portal Migration Features:** Promotion of the authenticated portal on token-based success pages and in RFQ emails, with auto-role detection for internal users.

### System Design Choices
-   **Modular Development:** Project developed in modular phases for completeness and testability.
-   **Role-Based Access Control (RBAC):** Granular permissions for Admin, Supplier, and Procurement roles.
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