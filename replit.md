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
-   **Dynamic Password Authentication:** Password login is database-driven - any user with role 'admin' or 'procurement' can use password authentication. When an admin creates a new admin/procurement user, they automatically get password login access (no code changes needed).
-   **Auto-generated RFQ Numbers:** Consistent `RFQ-YYYY-XXXXX` numbering.
-   **Data Validation:** Extensive backend schema validation using Zod.
-   **Public vs. Authenticated Routes:** Separate routing structures for secure and public access.

## External Dependencies
-   **PostgreSQL (Neon):** Primary database.
-   **Replit Object Storage:** For file uploads.
-   **Microsoft Graph API:** Production email service for magic links and RFQ notifications.

## Recent Changes (November 17, 2025)
-   **In-App Notification System:** Implemented complete notification system for admin/procurement users. When suppliers complete all required documents (status changes to final_submitted), all admin/procurement users receive in-app notifications. Features include:
    -   **Database Schema:** Added `notifications` table with userId foreign key, message, relatedQuoteId, isRead flag, and timestamp
    -   **Storage Layer:** Five CRUD methods for notification management (create, get by user, mark as read, mark all as read, get unread count)
    -   **Backend Logic:** Automatic notification creation when supplier completes all documents - triggers when status changes to final_submitted
    -   **API Endpoints:** Three secure endpoints (GET /api/notifications, PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all)
    -   **Security:** Ownership validation prevents cross-user notification access - users can only read/mark their own notifications
    -   **NotificationBell Component:** Bell icon in top-right header showing unread count badge, dropdown with recent notifications, click-to-navigate to quote detail page, mark as read functionality
    -   **Role-Based Access:** Bell only visible to admin/procurement users (role-gated in App.tsx)
    -   **Cache Management:** Uses `refetchQueries` pattern consistent with global `staleTime: Infinity` configuration
    -   **Real-time Updates:** Polls every 30 seconds for new notifications (refetchInterval: 30000)
    -   **Material Design:** Follows portal design system with proper spacing, hover states, and accessible UI
-   **Dashboard Enhancements:** Made all stat tiles clickable with programmatic tab navigation to relevant content sections
-   **Pending Docs Filtering:** Enhanced "Pending Docs" dashboard tile to link to filtered quote requests view. Backend now tracks `hasPendingDocs` flag for each request. Quote Requests page supports URL parameters (`?filter=pending-docs`) with two-way synchronization - URL updates when filter changes, and deep links work correctly. Client-side filtering shows only requests with quotes awaiting supplier documentation.
-   **Quote Detail Page Reordering:** Moved document sections above quote submission form for better workflow (documents first, then quote entry)
-   **Document Upload Security Fix:** Fixed 403 errors by implementing role-aware endpoint selection - admins use /api/quotes/:quoteId/documents, suppliers use /api/supplier/quotes/:quoteId/documents

## Previous Changes (November 13, 2025)
-   **Enhanced Document Error Handling:** Implemented comprehensive handling for ephemeral filesystem document loss while preserving database records. Added `fileExists` flag to all document API responses (GET `/api/quotes/:quoteId/documents`). Changed download endpoint error from 404 to 410 Gone with actionable JSON response including document metadata and re-upload guidance. Updated DocumentManager UI to visually distinguish missing files with amber borders, AlertCircle icons, disabled download buttons, and clear warning text: "File missing – please re-upload from the Upload Document section". Enhanced download handler to parse 410 responses and display server-provided suggestions via toast notifications. Added comprehensive data-testid attributes for automated testing.

## Previous Changes (November 12, 2025)
-   **URL Normalization Fix:** Fixed double-slash bug in magic link and document request emails. Added `normalizeBaseUrl()` helper that strips trailing slashes from BASE_URL before path concatenation. All email URLs now correctly formatted (e.g., `/verify-login` instead of `//verify-login`). Centralized URL construction exclusively through `getBaseUrl()` utility to prevent future recurrence.

## Previous Changes (November 11, 2025)
-   **Dynamic Admin Authentication:** Replaced hardcoded admin email allowlist with database-driven role checking. Password authentication now automatically available for any user with 'admin' or 'procurement' role - no code changes needed when creating new admin users.
-   **Document Request System:** Added missing `document_requests` table to database. Admins can now request specific documents (COA, SDS, Halal cert, etc.) from suppliers via the Quote Detail page.
-   **Email Template Fixes:** Fixed "Submit Quote" button text color (white) and "Login to Portal" link to use correct BASE_URL instead of development URL.
-   **Password Setup Flow:** Fixed missing verify-setup-token endpoint and post-setup redirect to landing page.

## Previous Changes (November 10, 2025)
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