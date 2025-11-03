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
-   **Database Schema:** Comprehensive schema including `users`, `suppliers`, `quote_requests`, `request_suppliers`, and `supplier_quotes` tables with defined enums and relationships. Material details are embedded directly in `quote_requests`.
-   **Authentication & User Management:** Dual authentication (Replit Auth and local username/password for admin testing), role-based access control (Admin, Supplier, Procurement), protected routes, and an Admin User Management interface. Includes robust security features like bcrypt hashing, rate limiting, and email normalization.
-   **Supplier Management:** CRUD operations for suppliers with API routes and a UI for listing and managing suppliers.
-   **Quote Request Creation:** A 4-step multi-step wizard for creating quote requests, including material details, specifications, supplier selection, and review. Features draft saving, auto-generated RFQ numbers (RFQ-YYYY-XXXXX), and date handling.
-   **Email Notifications:** A mock email service with professional HTML templates for RFQ notifications, sending emails to selected suppliers with token-based authentication links for quote submission. Includes a secure 64-character random access token system with 30-day expiration.
-   **Supplier Quote Submission:** A public, token-based interface for suppliers to submit quotes without requiring a login. It displays quote request details and includes a form for price, lead time, and other quote specifics, with backend validation.

### System Design Choices
-   **Modular Development:** The project is built in modular phases, ensuring each feature set is complete and testable.
-   **Role-Based Access Control (RBAC):** Granular permissions for Admin, Supplier, and Procurement roles.
-   **Token-Based Supplier Access:** Enables frictionless quote submission for suppliers without requiring traditional login.
-   **Auto-generated RFQ Numbers:** Consistent and trackable request numbering.
-   **Data Validation:** Extensive use of Zod for schema validation on the backend.

## External Dependencies
-   **PostgreSQL (Neon):** Primary database for data persistence.
-   **Replit Auth (OpenID Connect):** Used for user authentication.
-   **Replit Object Storage (Google Cloud Storage):** For file uploads.
-   **Microsoft Graph API:** Planned integration for official M365 email services (future).
-   **SendGrid:** Considered as an alternative email service provider (future).