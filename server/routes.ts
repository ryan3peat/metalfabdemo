import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { sql } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./auth";
import localPassport from "./auth/localAuth";
import { hashPassword, validatePasswordComplexity } from "./auth/localAuth";
import { insertUserSchema, insertSupplierSchema, insertSupplierQuoteSchema, insertDocumentRequestSchema, insertSupplierApplicationSchema, insertDemoLeadSchema, demoLeads } from "@shared/schema";
import { generateAccessToken, generateQuoteSubmissionUrl } from "./email/emailService";
import { emailService } from "./email/hybridEmailService";
import { validateQuoteAccessToken } from "./middleware/tokenAuth";
import { requireSupplierAccess } from "./middleware/supplierAuth";
import authRoutes from "./routes/authRoutes";
import { upload, validateFileSignature, getDocumentPath, deleteDocument, documentExists } from "./middleware/fileUpload";
import { generateMagicLinkToken, PASSWORD_SETUP_EXPIRY_MINUTES, getTokenExpiryDate } from "./auth/magicLink";
import { getBaseUrl } from "./utils/baseUrl";
import { notificationService } from "./notifications/notificationService";

// Demo mode: Mock admin user
const MOCK_ADMIN_USER = {
  id: "demo-admin-user",
  email: "admin@demo.com",
  firstName: "Demo",
  lastName: "Admin",
  role: "admin" as const,
  active: true,
  companyName: null,
  profileImageUrl: null,
  passwordHash: null,
  passwordSetAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Helper function to get user ID from local auth or supplier sessions
// Demo mode: Always return demo admin user ID
function getUserId(req: any): string | undefined {
  // In demo mode, always return demo admin user ID
  return "demo-admin-user";
}

// Helper function to get current user (returns mock admin in demo mode)
async function getCurrentUser(req: any) {
  const userId = getUserId(req);
  if (!userId) {
    return undefined;
  }
  
  // In demo mode, return mock admin user
  if (userId === "demo-admin-user") {
    return MOCK_ADMIN_USER;
  }
  
  // Otherwise, fetch from database (for backwards compatibility)
  return await storage.getUser(userId);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Magic link authentication routes
  app.use('/api/auth', authRoutes);

  // Local authentication routes
  app.post('/api/local/login', (req, res, next) => {
    localPassport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('[LocalAuth] Login error:', err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('[LocalAuth] Session error:', err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        // Return success without exposing sensitive user data
        return res.json({ message: "Login successful" });
      });
    })(req, res, next);
  });

  // Set password route (admin only - for initial setup)
  app.post('/api/local/set-password', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      const { targetUserId, password } = req.body;

      if (!targetUserId || !password) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate password complexity
      const validation = validatePasswordComplexity(password);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      // Hash password and update user
      const passwordHash = await hashPassword(password);
      const updatedUser = await storage.setUserPassword(targetUserId, passwordHash);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Password set successfully" });
    } catch (error) {
      console.error("Error setting password:", error);
      res.status(500).json({ message: "Failed to set password" });
    }
  });

  // Auth routes - Demo mode: Return mock admin user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Demo mode: Return mock admin user
      const mockUser = {
        id: "demo-admin-user",
        email: "admin@demo.com",
        firstName: "Demo",
        lastName: "Admin",
        role: "admin" as const,
        active: true,
        companyName: null,
        profileImageUrl: null,
        passwordHash: null,
        passwordSetAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      res.json(mockUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'supplier', 'procurement'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(id, role);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch('/api/users/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id } = req.params;
      const { active } = req.body;

      if (typeof active !== 'boolean') {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const updatedUser = await storage.updateUserStatus(id, active);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      // Validate request body
      const validationResult = insertUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(validationResult.data.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      const newUser = await storage.createUser(validationResult.data);

      // Send password setup email for Admin and Procurement users
      if (newUser.role === 'admin' || newUser.role === 'procurement') {
        try {
          const { token, tokenHash } = generateMagicLinkToken();

          await storage.createMagicLink({
            email: newUser.email!,
            tokenHash,
            type: 'password_setup',
            expiresAt: getTokenExpiryDate('password_setup'),
          });

          const baseUrl = getBaseUrl();
          const setupLink = `${baseUrl}/set-password?token=${token}`;

          const emailResult = await emailService.sendPasswordSetupEmail(
            newUser.email!,
            newUser.firstName || 'User',
            newUser.lastName || '',
            {
              setupLink,
              expiryMinutes: PASSWORD_SETUP_EXPIRY_MINUTES,
            }
          );

          if (!emailResult.success) {
            console.error('Failed to send password setup email:', emailResult.error);
            // Don't fail the user creation, just log the error
          }
        } catch (emailError) {
          console.error('Error sending password setup email:', emailError);
          // Don't fail the user creation, just log the error
        }
      }

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id } = req.params;
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting yourself
      if (id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Supplier management routes (admin/procurement only)
  app.get('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.get('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id } = req.params;
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      // Validate request body
      const validationResult = insertSupplierSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const supplierData = {
        ...validationResult.data,
        createdBy: userId,
      };

      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.patch('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id } = req.params;
      
      // Validate partial update data
      const validationResult = insertSupplierSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const updatedSupplier = await storage.updateSupplier(id, validationResult.data);
      
      if (!updatedSupplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      res.json(updatedSupplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id } = req.params;
      
      // Check if supplier exists
      const supplier = await storage.getSupplier(id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      await storage.deleteSupplier(id);
      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Quote Request Routes (admin/procurement only)
  app.get('/api/quote-requests', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const requests = await storage.getQuoteRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching quote requests:", error);
      res.status(500).json({ message: "Failed to fetch quote requests" });
    }
  });

  app.get('/api/quote-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id } = req.params;
      const details = await storage.getQuoteRequestDetails(id);

      if (!details) {
        return res.status(404).json({ message: "Quote request not found" });
      }

      res.json(details);
    } catch (error) {
      console.error("Error fetching quote request details:", error);
      res.status(500).json({ message: "Failed to fetch quote request details" });
    }
  });

  // Get individual quote details (admin/procurement only)
  app.get('/api/quotes/:quoteId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { quoteId } = req.params;
      const quoteDetails = await storage.getQuoteDetails(quoteId);

      if (!quoteDetails) {
        return res.status(404).json({ message: "Quote not found" });
      }

      res.json(quoteDetails);
    } catch (error) {
      console.error("Error fetching quote details:", error);
      res.status(500).json({ message: "Failed to fetch quote details" });
    }
  });

  // Request documents from supplier (admin/procurement only)
  app.post('/api/quotes/:quoteId/request-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const currentUser = await getCurrentUser(req);

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { quoteId } = req.params;

      // Validate request body
      const validationResult = insertDocumentRequestSchema.safeParse({
        ...req.body,
        quoteId,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors
        });
      }

      // Get quote details to fetch supplier information
      const quoteDetails = await storage.getQuoteDetails(quoteId);
      if (!quoteDetails) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const { quote, supplier, request } = quoteDetails;

      // Validate quote has requestId before proceeding
      if (!quote.requestId) {
        console.error(`❌ CRITICAL: Quote ${quoteId} is missing requestId - cannot generate email link`);
        return res.status(500).json({ 
          message: "Internal error: Quote is missing required request reference" 
        });
      }

      // Create document request record
      const documentRequest = await storage.createDocumentRequest({
        quoteId,
        requestedDocuments: req.body.requestedDocuments,
        requestedBy: userId,
      });

      // Send email notification to supplier
      try {
        const baseUrl = getBaseUrl();
        const supplierPortalUrl = `${baseUrl}/supplier/quote-requests/${quote.requestId}`;
        
        console.log(`📧 Sending document request email to ${supplier.email}`);
        console.log(`   Link: ${supplierPortalUrl}`);
        
        const emailResult = await emailService.sendDocumentRequestEmail(
          {
            email: supplier.email,
            name: supplier.supplierName,
          },
          {
            rfqNumber: request.requestNumber,
            materialName: request.materialName,
            requestedDocuments: req.body.requestedDocuments,
            supplierPortalUrl,
          }
        );

        if (emailResult.success) {
          await storage.updateDocumentRequestEmailSent(documentRequest.id, new Date());
        }
      } catch (emailError) {
        console.error("Error sending document request email:", emailError);
        // Don't fail the request if email fails
      }

      res.json({
        message: "Document request sent successfully",
        documentRequest
      });
    } catch (error) {
      console.error("Error requesting documents:", error);
      res.status(500).json({ message: "Failed to request documents" });
    }
  });

  // Get document requests for a quote
  app.get('/api/quotes/:quoteId/document-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { quoteId } = req.params;

      // Get document requests for this quote
      const documentRequests = await storage.getDocumentRequestsByQuote(quoteId);

      res.json(documentRequests);
    } catch (error) {
      console.error("Error fetching document requests:", error);
      res.status(500).json({ message: "Failed to fetch document requests" });
    }
  });

  app.post('/api/quote-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const currentUser = await getCurrentUser(req);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      // Generate RFQ number
      const requestNumber = await storage.generateRfqNumber();

      // Extract supplier IDs from request body
      const { supplierIds, ...requestData } = req.body;

      // Convert submitByDate string to Date object
      if (requestData.submitByDate) {
        requestData.submitByDate = new Date(requestData.submitByDate);
      }

      // Ensure quantityNeeded is a valid string for numeric type
      if (requestData.quantityNeeded !== undefined && requestData.quantityNeeded !== null) {
        requestData.quantityNeeded = String(requestData.quantityNeeded);
      }

      console.log('Creating quote request with data:', {
        ...requestData,
        requestNumber,
        status: 'active',
        createdBy: userId,
      });

      // Create the quote request with status 'active'
      const quoteRequest = await storage.createQuoteRequest({
        ...requestData,
        requestNumber,
        status: 'active',
        createdBy: userId,
      });

      // Create request-supplier relationships and send email notifications
      if (supplierIds && Array.isArray(supplierIds)) {
        for (const supplierId of supplierIds) {
          // Generate unique access token for this supplier
          const accessToken = generateAccessToken();
          const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

          // Create request-supplier relationship with token
          const requestSupplier = await storage.createRequestSupplier({
            requestId: quoteRequest.id,
            supplierId: supplierId,
            accessToken,
            tokenExpiresAt,
          });

          // Fetch supplier details for email
          const supplier = await storage.getSupplier(supplierId);
          
          if (supplier && supplier.email) {
            // Send RFQ notification email
            const quoteSubmissionUrl = generateQuoteSubmissionUrl(quoteRequest.id, accessToken);
            
            const emailResult = await emailService.sendRFQNotification(
              {
                email: supplier.email,
                name: supplier.supplierName,
                supplierId: supplier.id,
              },
              {
                requestNumber: quoteRequest.requestNumber,
                materialName: quoteRequest.materialName,
                materialType: quoteRequest.materialType || undefined,
                materialGrade: quoteRequest.materialGrade || undefined,
                thickness: quoteRequest.thickness || undefined,
                finish: quoteRequest.finish || undefined,
                quantityNeeded: quoteRequest.quantityNeeded,
                unitOfMeasure: quoteRequest.unitOfMeasure,
                submitByDate: quoteRequest.submitByDate,
                additionalSpecifications: quoteRequest.additionalSpecifications || undefined,
                accessToken,
                quoteSubmissionUrl,
              }
            );

            // Update request-supplier with email sent timestamp if successful
            if (emailResult.success) {
              await storage.updateRequestSupplier(requestSupplier.id, {
                emailSentAt: new Date(),
              });
            }
          }
        }
      }

      res.status(201).json(quoteRequest);
    } catch (error: any) {
      console.error("Error creating quote request:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        message: "Failed to create quote request",
        error: error.message || "Unknown error"
      });
    }
  });

  app.post('/api/quote-requests/draft', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      // Generate RFQ number
      const requestNumber = await storage.generateRfqNumber();

      // Extract supplier IDs from request body
      const { supplierIds, ...requestData } = req.body;

      // Convert submitByDate string to Date object if provided
      if (requestData.submitByDate) {
        requestData.submitByDate = new Date(requestData.submitByDate);
      }

      // Create the quote request with status 'draft'
      const quoteRequest = await storage.createQuoteRequest({
        ...requestData,
        requestNumber,
        status: 'draft',
        createdBy: userId,
        // Set default values for optional fields if not provided
        materialName: requestData.materialName || 'Draft - Material Pending',
        quantityNeeded: requestData.quantityNeeded || '0',
        unitOfMeasure: requestData.unitOfMeasure || 'kg',
        submitByDate: requestData.submitByDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Create request-supplier relationships if suppliers were selected
      if (supplierIds && Array.isArray(supplierIds)) {
        for (const supplierId of supplierIds) {
          await storage.createRequestSupplier({
            requestId: quoteRequest.id,
            supplierId: supplierId,
          });
        }
      }

      res.status(201).json(quoteRequest);
    } catch (error) {
      console.error("Error creating draft quote request:", error);
      res.status(500).json({ message: "Failed to create draft quote request" });
    }
  });

  app.patch('/api/quote-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id } = req.params;
      
      // Check if quote request exists
      const existingRequest = await storage.getQuoteRequest(id);
      if (!existingRequest) {
        return res.status(404).json({ message: "Quote request not found" });
      }

      const updatedRequest = await storage.updateQuoteRequest(id, req.body);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating quote request:", error);
      res.status(500).json({ message: "Failed to update quote request" });
    }
  });

  // Delete quote request (admin/procurement only)
  app.delete('/api/quote-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id } = req.params;

      // Check if quote request exists
      const existingRequest = await storage.getQuoteRequest(id);
      if (!existingRequest) {
        return res.status(404).json({ message: "Quote request not found" });
      }

      // Get all supplier quotes to delete associated documents
      const quotes = await storage.getSupplierQuotes(id);

      // Delete all documents associated with these quotes
      for (const quote of quotes) {
        const documents = await storage.getSupplierDocuments(quote.id);
        for (const doc of documents) {
          try {
            await deleteDocument(doc.fileUrl);
          } catch (fileError) {
            console.error(`Error deleting file ${doc.fileUrl}:`, fileError);
            // Continue with other deletions even if one fails
          }
        }
      }

      // Delete the quote request (cascade will handle DB records)
      await storage.deleteQuoteRequest(id);

      res.json({ message: "Quote request deleted successfully" });
    } catch (error) {
      console.error("Error deleting quote request:", error);
      res.status(500).json({ message: "Failed to delete quote request" });
    }
  });

  // Resend RFQ notification to a specific supplier (admin/procurement only)
  app.post('/api/quote-requests/:id/resend-notification/:supplierId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id: requestId, supplierId } = req.params;

      // Get the quote request
      const quoteRequest = await storage.getQuoteRequest(requestId);
      if (!quoteRequest) {
        return res.status(404).json({ message: "Quote request not found" });
      }

      // Get the supplier
      const supplier = await storage.getSupplier(supplierId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Get the request-supplier relationship
      const requestSupplier = await storage.getRequestSupplierByRequestAndSupplier(requestId, supplierId);
      if (!requestSupplier) {
        return res.status(404).json({ message: "Supplier is not associated with this quote request" });
      }

      // Check if supplier has already submitted a quote
      const existingQuotes = await storage.getSupplierQuotes(requestId);
      const hasSubmittedQuote = existingQuotes.some(q => q.supplierId === supplierId);
      if (hasSubmittedQuote) {
        return res.status(400).json({ message: "Supplier has already submitted a quote for this request" });
      }

      // Use the existing access token or generate a new one
      let accessToken = requestSupplier.accessToken;
      if (!accessToken) {
        accessToken = generateAccessToken();
        const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await storage.updateRequestSupplier(requestSupplier.id, {
          accessToken,
          tokenExpiresAt,
        });
      }

      // Send RFQ notification email
      const quoteSubmissionUrl = generateQuoteSubmissionUrl(quoteRequest.id, accessToken);
      
      const emailResult = await emailService.sendRFQNotification(
        {
          email: supplier.email,
          name: supplier.supplierName,
          supplierId: supplier.id,
        },
        {
          requestNumber: quoteRequest.requestNumber,
          materialName: quoteRequest.materialName,
          materialType: quoteRequest.materialType || undefined,
          materialGrade: quoteRequest.materialGrade || undefined,
          thickness: quoteRequest.thickness || undefined,
          finish: quoteRequest.finish || undefined,
          quantityNeeded: quoteRequest.quantityNeeded,
          unitOfMeasure: quoteRequest.unitOfMeasure,
          submitByDate: quoteRequest.submitByDate,
          additionalSpecifications: quoteRequest.additionalSpecifications || undefined,
          accessToken,
          quoteSubmissionUrl,
        }
      );

      if (emailResult.success) {
        // Update email sent timestamp
        await storage.updateRequestSupplier(requestSupplier.id, {
          emailSentAt: new Date(),
        });

        res.json({ 
          success: true, 
          message: "Quote request reminder sent successfully",
          emailSentAt: new Date().toISOString()
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to send email notification",
          error: emailResult.error 
        });
      }
    } catch (error) {
      console.error("Error resending RFQ notification:", error);
      res.status(500).json({ message: "Failed to resend notification" });
    }
  });

  // Admin dashboard statistics
  app.get('/api/admin/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard statistics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // ============================================================================
  // SUPPLIER PORTAL API ROUTES (Authenticated supplier access)
  // ============================================================================

  // Get supplier dashboard statistics
  app.get('/api/supplier/dashboard', isAuthenticated, requireSupplierAccess, async (req: any, res) => {
    try {
      const supplier = req.supplier;
      const quoteRequests = await storage.getSupplierQuoteRequests(supplier.id);
      
      const now = new Date();
      
      // Categorize requests
      const ongoing = quoteRequests.filter(qr =>
        !qr.quote && new Date(qr.request.submitByDate) > now
      );

      // Pending Documentation: Quotes where supplier needs to upload documents
      const pendingDocumentation = quoteRequests.filter(qr =>
        qr.quote && qr.quote.preliminaryApprovalStatus === 'pending_documentation'
      );

      const expired = quoteRequests.filter(qr =>
        !qr.quote && new Date(qr.request.submitByDate) <= now
      );

      // Final Submitted: All documentation complete
      const finalSubmitted = quoteRequests.filter(qr =>
        qr.quote && qr.quote.preliminaryApprovalStatus === 'final_submitted'
      );

      // Initial Submitted: Awaiting admin review
      const initialSubmitted = quoteRequests.filter(qr =>
        qr.quote && qr.quote.preliminaryApprovalStatus === 'initial_submitted'
      );

      res.json({
        totalRequests: quoteRequests.length,
        ongoing: ongoing.length,
        pendingDocumentation: pendingDocumentation.length,  // Renamed from 'approved'
        expired: expired.length,
        finalSubmitted: finalSubmitted.length,
        initialSubmitted: initialSubmitted.length,
        quotesSubmitted: quoteRequests.filter(qr => qr.quote).length,
      });
    } catch (error) {
      console.error("Error fetching supplier dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Get all quote requests for supplier
  app.get('/api/supplier/quote-requests', isAuthenticated, requireSupplierAccess, async (req: any, res) => {
    try {
      const supplier = req.supplier;
      const quoteRequests = await storage.getSupplierQuoteRequests(supplier.id);
      
      // Transform and categorize requests
      const now = new Date();
      const transformed = await Promise.all(quoteRequests.map(async qr => {
        let documentsRequested = 0;
        let documentsUploaded = 0;

        // For quotes pending documentation or final_submitted, get document counts
        if (qr.quote && (qr.quote.preliminaryApprovalStatus === 'pending_documentation' ||
                         qr.quote.preliminaryApprovalStatus === 'final_submitted')) {
          const documentRequests = await storage.getDocumentRequestsByQuote(qr.quote.id);
          const supplierDocuments = await storage.getSupplierDocuments(qr.quote.id);

          // Count total documents requested across all document request rows
          documentsRequested = documentRequests.reduce((sum, dr) =>
            sum + (dr.requestedDocuments as string[]).length, 0
          );
          documentsUploaded = supplierDocuments.length;
        }

        return {
          ...qr.request,
          requestSupplier: qr.requestSupplier,
          quote: qr.quote ? {
            ...qr.quote,
            documentsRequested,
            documentsUploaded,
          } : null,
          isExpired: new Date(qr.request.submitByDate) <= now,
          hasQuote: !!qr.quote,
        };
      }));

      res.json(transformed);
    } catch (error) {
      console.error("Error fetching supplier quote requests:", error);
      res.status(500).json({ message: "Failed to fetch quote requests" });
    }
  });

  // Get specific quote request details for supplier
  app.get('/api/supplier/quote-requests/:requestId', isAuthenticated, requireSupplierAccess, async (req: any, res) => {
    try {
      const supplier = req.supplier;
      const { requestId } = req.params;

      // Get all supplier's requests to verify access
      const quoteRequests = await storage.getSupplierQuoteRequests(supplier.id);
      const requestAccess = quoteRequests.find(qr => qr.request.id === requestId);

      if (!requestAccess) {
        return res.status(403).json({ message: "Access denied to this quote request" });
      }

      // Get full request details
      const request = await storage.getQuoteRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Quote request not found" });
      }


      res.json({
        request,
        requestSupplier: requestAccess.requestSupplier,
        quote: requestAccess.quote,
        supplier: {
          id: supplier.id,
          supplierName: supplier.supplierName,
          email: supplier.email,
        },
      });
    } catch (error) {
      console.error("Error fetching supplier quote request details:", error);
      res.status(500).json({ message: "Failed to fetch quote request details" });
    }
  });

  // Submit or update a quote
  app.post('/api/supplier/quotes', isAuthenticated, requireSupplierAccess, async (req: any, res) => {
    try {
      console.log('=== SUPPLIER QUOTE SUBMISSION ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const supplier = req.supplier;
      const { requestId, ...rawQuoteData } = req.body;
      
      console.log('Supplier ID:', supplier.id);
      console.log('Request ID:', requestId);
      console.log('Raw quote data:', JSON.stringify(rawQuoteData, null, 2));
      
      // Validate and transform quote data using Zod schema
      const validation = insertSupplierQuoteSchema.safeParse(rawQuoteData);
      if (!validation.success) {
        console.error('Validation failed:', validation.error.errors);
        return res.status(400).json({ 
          message: "Invalid quote data", 
          errors: validation.error.errors 
        });
      }
      
      const quoteData = validation.data;
      console.log('Validated quote data:', JSON.stringify(quoteData, null, 2));

      // Verify supplier has access to this request
      const quoteRequests = await storage.getSupplierQuoteRequests(supplier.id);
      console.log('Supplier has access to', quoteRequests.length, 'quote requests');
      const hasAccess = quoteRequests.some(qr => qr.request.id === requestId);
      console.log('Has access to request:', hasAccess);

      if (!hasAccess) {
        console.error('Access denied - supplier does not have access to this request');
        return res.status(403).json({ message: "Access denied to this quote request" });
      }

      // Convert numeric fields to strings for database
      const dbQuoteData = {
        ...quoteData,
        pricePerUnit: quoteData.pricePerUnit.toString(),
        freightCost: quoteData.freightCost?.toString(),
        attachments: [], // Default to empty array
      };

      // Check if quote already exists
      const existingQuotes = await storage.getSupplierQuotes(requestId);
      const existingQuote = existingQuotes.find(q => q.supplierId === supplier.id);

      let quote;
      if (existingQuote) {
        // Update existing quote
        quote = await storage.updateSupplierQuote(existingQuote.id, dbQuoteData);
      } else {
        // Create new quote
        quote = await storage.createSupplierQuote({
          ...dbQuoteData,
          requestId,
          supplierId: supplier.id,
        });

        console.log('✅ New supplier quote created:', {
          id: quote.id,
          preliminaryApprovalStatus: quote.preliminaryApprovalStatus,
          status: quote.status,
        });

        // Update request_suppliers to mark response as submitted
        const requestSuppliers = await storage.getRequestSuppliers(requestId);
        const requestSupplier = requestSuppliers.find(rs => rs.supplierId === supplier.id);

        if (requestSupplier) {
          await storage.updateRequestSupplier(requestSupplier.id, {
            responseSubmittedAt: new Date(),
          });
        }
      }

      if (!quote) {
        return res.status(500).json({ message: "Failed to save quote" });
      }

      console.log('📤 Returning quote to supplier:', {
        id: quote.id,
        preliminaryApprovalStatus: quote.preliminaryApprovalStatus,
      });

      res.json(quote);
    } catch (error) {
      console.error("Error submitting supplier quote:", error);
      res.status(500).json({ message: "Failed to submit quote" });
    }
  });

  // Get documents for a quote (supplier access)
  app.get('/api/supplier/quotes/:quoteId/documents', isAuthenticated, requireSupplierAccess, async (req: any, res) => {
    try {
      const supplier = req.supplier;
      const { quoteId } = req.params;

      // Verify supplier owns this quote
      const quote = await storage.getSupplierQuote(quoteId);
      if (!quote || quote.supplierId !== supplier.id) {
        return res.status(403).json({ message: "Access denied to this quote" });
      }

      const documents = await storage.getSupplierDocuments(quoteId);
      
      // Add fileExists flag to each document
      const documentsWithFileStatus = documents.map(doc => ({
        ...doc,
        fileExists: documentExists(doc.fileUrl)
      }));
      
      res.json(documentsWithFileStatus);
    } catch (error) {
      console.error("Error fetching supplier documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get documents for a quote (admin/procurement/supplier access)
  app.get('/api/quotes/:quoteId/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { quoteId } = req.params;

      // Check if quote exists
      const quote = await storage.getSupplierQuote(quoteId);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Check access permissions
      const currentUser = await getCurrentUser(req);
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'procurement';
      const isQuoteOwner = req.supplier && req.supplier.id === quote.supplierId;

      if (!isAdmin && !isQuoteOwner) {
        return res.status(403).json({ message: "Access denied to this quote" });
      }

      const documents = await storage.getSupplierDocuments(quoteId);
      
      // Add fileExists flag to each document
      const documentsWithFileStatus = documents.map(doc => ({
        ...doc,
        fileExists: documentExists(doc.fileUrl)
      }));
      
      res.json(documentsWithFileStatus);
    } catch (error) {
      console.error("Error fetching quote documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Upload a document for a quote
  app.post('/api/supplier/quotes/:quoteId/documents',
    isAuthenticated,
    requireSupplierAccess,
    upload.single('file'),
    async (req: any, res) => {
      try {
        const supplier = req.supplier;
        const userId = req.userId;
        const { quoteId } = req.params;
        const { documentType } = req.body;
        const file = req.file;

        if (!file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        if (!documentType) {
          // Clean up uploaded file if validation fails
          await deleteDocument(file.filename);
          return res.status(400).json({ message: "Document type is required" });
        }

        // Verify supplier owns this quote
        const quote = await storage.getSupplierQuote(quoteId);
        if (!quote || quote.supplierId !== supplier.id) {
          await deleteDocument(file.filename);
          return res.status(403).json({ message: "Access denied to this quote" });
        }

        // Verify quote is awaiting documentation
        if (quote.preliminaryApprovalStatus !== 'pending_documentation' && quote.preliminaryApprovalStatus !== 'final_submitted') {
          await deleteDocument(file.filename);
          return res.status(403).json({
            message: "Documents can only be uploaded when documentation is requested (status: pending_documentation)"
          });
        }

        // Validate file signature for security
        const isValidFile = await validateFileSignature(getDocumentPath(file.filename));
        if (!isValidFile) {
          await deleteDocument(file.filename);
          return res.status(400).json({ message: "Invalid or corrupted file" });
        }

        // Save document metadata to database
        const document = await storage.createSupplierDocument({
          supplierQuoteId: quoteId,
          documentType,
          fileUrl: file.filename, // Store filename, not full path
          fileName: file.originalname,
          fileSize: file.size.toString(),
          mimeType: file.mimetype,
          uploadedBy: userId,
        });

        // Send notifications to admins for document uploads
        try {
          const quoteDetails = await storage.getQuoteDetails(quoteId);

          if (quoteDetails) {
            const { quote, supplier: quoteSupplier, request } = quoteDetails;

            // Get all uploaded documents (including the one we just uploaded)
            const allUploadedDocs = await storage.getSupplierDocuments(quoteId);
            const uploadedDocTypes = allUploadedDocs.map(d => d.documentType);

            // Get all requested documents
            const documentRequests = await storage.getDocumentRequestsByQuote(quoteId);
            const allRequestedDocTypes = Array.from(
              new Set(documentRequests.flatMap(dr => dr.requestedDocuments as string[]))
            );

            // Calculate remaining documents
            const remainingDocs = allRequestedDocTypes.filter(
              docType => !uploadedDocTypes.includes(docType as any)
            ).length;

            // Check if ALL requested documents are now uploaded
            const allDocumentsComplete = allRequestedDocTypes.length > 0 && remainingDocs === 0;

            if (allDocumentsComplete) {
              // Update quote status to final_submitted
              await storage.updateSupplierQuote(quoteId, {
                preliminaryApprovalStatus: 'final_submitted',
              });

              // Update document request status to completed
              await storage.updateDocumentRequestStatus(quoteId, 'completed');

              console.log(`✅ All documents complete! Status updated to 'final_submitted' and document requests marked as 'completed'`);

              // Get admin/procurement users for email
              const adminUsers = await db.select()
                .from(users)
                .where(sql`${users.role} IN ('admin', 'procurement') AND ${users.active} = true`);

              const adminEmails = adminUsers
                .filter(u => u.email)
                .map(u => u.email as string);

              // Send email notification for completion
              if (adminEmails.length > 0 && quote.requestId) {
                const quoteDetailUrl = `${getBaseUrl()}/quote-requests/${quote.requestId}/quotes/${quoteId}`;

                await emailService.sendDocumentUploadNotification(adminEmails, {
                  supplierName: quoteSupplier.supplierName,
                  rfqNumber: request.requestNumber,
                  materialName: request.materialName,
                  documentType,
                  fileName: file.originalname,
                  quoteDetailUrl,
                  totalUploaded: allUploadedDocs.length,
                  totalRequested: allRequestedDocTypes.length,
                });

                console.log(`✅ Email notification sent to ${adminEmails.length} admin(s)`);
              }

              // Send real-time notification for documentation complete
              if (quote.requestId) {
                await notificationService.notifyAdminsOfDocumentationComplete({
                  supplierName: quoteSupplier.supplierName,
                  requestNumber: request.requestNumber,
                  quoteId,
                  requestId: quote.requestId,
                });
              }
            } else {
              // Send notification for individual document upload (not completion)
              if (quote.requestId) {
                await notificationService.notifyAdminsOfDocumentUpload({
                  supplierName: quoteSupplier.supplierName,
                  requestNumber: request.requestNumber,
                  materialName: request.materialName,
                  documentType,
                  quoteId,
                  requestId: quote.requestId,
                  remainingDocs,
                });
              }
              console.log(`📄 Document uploaded. ${remainingDocs} document(s) still pending.`);
            }
          }
        } catch (notifyError) {
          // Don't fail the upload if notification fails
          console.error("Failed to send document upload notification:", notifyError);
        }

        res.status(201).json({
          message: "Document uploaded successfully",
          document
        });
      } catch (error: any) {
        console.error("Error uploading supplier document:", error);

        // Clean up file if database operation failed
        if (req.file) {
          try {
            await deleteDocument(req.file.filename);
          } catch (cleanupError) {
            console.error("Error cleaning up file:", cleanupError);
          }
        }

        // Handle multer errors
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: "File size exceeds 10MB limit" });
        }

        res.status(500).json({ message: error.message || "Failed to upload document" });
      }
    }
  );

  // Download a document
  app.get('/api/documents/:documentId/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { documentId } = req.params;

      // Get document from database
      const document = await storage.getSupplierDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Get the quote to check access permissions
      const quote = await storage.getSupplierQuote(document.supplierQuoteId);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Check if user has access (admin/procurement or quote owner)
      const currentUser = await getCurrentUser(req);
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'procurement';
      const isQuoteOwner = req.supplier && req.supplier.id === quote.supplierId;

      if (!isAdmin && !isQuoteOwner) {
        return res.status(403).json({ message: "Access denied to this document" });
      }

      // Check if file exists
      const filePath = getDocumentPath(document.fileUrl);
      if (!documentExists(document.fileUrl)) {
        console.error(`❌ File missing for document ${documentId}: ${document.fileUrl}`);
        return res.status(410).json({ 
          message: "File no longer available on server",
          documentId: document.id,
          fileName: document.fileName,
          documentType: document.documentType,
          uploadedAt: document.uploadedAt,
          suggestion: "The file was lost due to server restart. Please re-upload this document."
        });
      }

      // Send file
      res.download(filePath, document.fileName, (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          if (!res.headersSent) {
            res.status(500).json({ message: "Failed to download file" });
          }
        }
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to download document" });
      }
    }
  });

  // Delete a document
  app.delete('/api/supplier/documents/:documentId', isAuthenticated, requireSupplierAccess, async (req: any, res) => {
    try {
      const supplier = req.supplier;
      const { documentId } = req.params;

      // Get document to verify ownership
      const document = await storage.getSupplierDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Get quote to verify supplier owns it
      const quote = await storage.getSupplierQuote(document.supplierQuoteId);
      if (!quote || quote.supplierId !== supplier.id) {
        return res.status(403).json({ message: "Access denied to this document" });
      }

      // Delete file from filesystem
      try {
        await deleteDocument(document.fileUrl);
      } catch (fileError) {
        console.error("Error deleting file from filesystem:", fileError);
        // Continue with database deletion even if file deletion fails
      }

      // Delete document record from database
      await storage.deleteSupplierDocument(documentId);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting supplier document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // ============================================================================
  // NOTIFICATION ROUTES
  // ============================================================================

  // Get notifications for current user
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const [notifications, unreadCount] = await Promise.all([
        storage.getNotificationsByUser(userId, 10),
        storage.getUnreadNotificationCount(userId),
      ]);

      res.json({
        notifications,
        unreadCount,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      
      // Verify notification belongs to this user before marking as read
      const userNotifications = await storage.getNotificationsByUser(userId, 1000);
      const notification = userNotifications.find(n => n.id === id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found or access denied" });
      }
      
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Admin: Request documentation from supplier (moves status to pending_documentation)
  app.patch('/api/supplier/quotes/:quoteId/preliminary-approval', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const currentUser = await getCurrentUser(req);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { quoteId } = req.params;
      const { status } = req.body; // 'pending_documentation' or 'rejected'

      // Map old 'approved' status to new 'pending_documentation' for backwards compatibility
      let newStatus = status;
      if (status === 'approved') {
        newStatus = 'pending_documentation';
      }

      if (!['pending_documentation', 'rejected'].includes(newStatus)) {
        return res.status(400).json({ message: "Invalid approval status. Use 'pending_documentation' or 'rejected'" });
      }

      const quote = await storage.updateSupplierQuote(quoteId, {
        preliminaryApprovalStatus: newStatus,
        preliminaryApprovedAt: new Date(),
        preliminaryApprovedBy: userId,
      });

      res.json(quote);
    } catch (error) {
      console.error("Error updating preliminary approval:", error);
      res.status(500).json({ message: "Failed to update approval status" });
    }
  });

  // ============================================================================
  // SUPPLIER APPLICATION ROUTES
  // ============================================================================

  // Submit a supplier application (public - no auth required in demo mode)
  app.post('/api/supplier-applications', isAuthenticated, async (req: any, res) => {
    try {
      // Validate request body
      const validationResult = insertSupplierApplicationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }

      const application = await storage.createSupplierApplication(validationResult.data);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating supplier application:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  // List all supplier applications (admin/procurement only)
  app.get('/api/supplier-applications', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const applications = await storage.getSupplierApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching supplier applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Get specific supplier application details (admin/procurement only)
  app.get('/api/supplier-applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id } = req.params;
      const application = await storage.getSupplierApplication(id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json(application);
    } catch (error) {
      console.error("Error fetching supplier application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  // Update application status (approve/reject) (admin/procurement only)
  app.patch('/api/supplier-applications/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Use 'pending', 'approved', or 'rejected'" });
      }

      const application = await storage.updateSupplierApplicationStatus(
        id,
        status,
        userId,
        reviewNotes
      );

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json(application);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  // Convert approved application to supplier (admin/procurement only)
  app.post('/api/supplier-applications/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'procurement')) {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { id } = req.params;
      const application = await storage.getSupplierApplication(id);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (application.status !== 'approved') {
        return res.status(400).json({ message: "Application must be approved before converting to supplier" });
      }

      // Check if supplier with this email already exists
      const existingSupplier = await storage.getSupplierByEmail(application.email);
      if (existingSupplier) {
        return res.status(409).json({ message: "A supplier with this email already exists" });
      }

      // Convert application to supplier
      const supplierData: InsertSupplier = {
        supplierName: application.companyName,
        contactPerson: application.contactPerson,
        email: application.email,
        email2: null,
        phone: application.phone || null,
        location: application.address ? `${application.address}, ${application.city || ''}, ${application.state || ''} ${application.postcode || ''}`.trim() : null,
        moq: null,
        leadTimes: application.leadTimes || null,
        paymentTerms: null,
        certifications: application.certifications || [],
        active: true,
        createdBy: userId,
      };

      const supplier = await storage.createSupplier(supplierData);

      res.json({
        message: "Supplier created successfully",
        supplier,
        application,
      });
    } catch (error) {
      console.error("Error converting application to supplier:", error);
      res.status(500).json({ message: "Failed to convert application to supplier" });
    }
  });

  // ============================================================================
  // LEAD CAPTURE
  // ============================================================================
  app.post('/api/leads', async (req: any, res) => {
    try {
      const validation = insertDemoLeadSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid lead data",
          errors: validation.error.errors,
        });
      }

      const [lead] = await db.insert(demoLeads).values({
        ...validation.data,
        sessionId: req.body.sessionId || 'unknown-session',
      }).returning();

      res.json({ success: true, lead });
    } catch (error) {
      console.error("Error capturing lead:", error);
      // In demo mode, don't fail the user even if DB is unavailable
      res.status(200).json({ success: true, message: "Lead captured (demo mode fallback)" });
    }
  });

  // ============================================================================
  // PUBLIC API ROUTES (Token-based access - no authentication required)
  // ============================================================================

  // Get quote request details for public quote submission (token-based access)
  app.get('/api/public/quote-requests/:id', validateQuoteAccessToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { supplierId } = req.supplierAccess;

      // Get the quote request
      const request = await storage.getQuoteRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Quote request not found" });
      }

      // Get the supplier details
      const supplier = await storage.getSupplier(supplierId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Return only necessary information for quote submission
      res.json({
        request: {
          id: request.id,
          requestNumber: request.requestNumber,
          materialName: request.materialName,
          materialType: request.materialType,
          materialGrade: request.materialGrade,
          thickness: request.thickness,
          dimensions: request.dimensions,
          finish: request.finish,
          tolerance: request.tolerance,
          weldingRequirements: request.weldingRequirements,
          surfaceTreatment: request.surfaceTreatment,
          quantityNeeded: request.quantityNeeded,
          unitOfMeasure: request.unitOfMeasure,
          submitByDate: request.submitByDate,
          additionalSpecifications: request.additionalSpecifications,
          status: request.status,
        },
        supplier: {
          id: supplier.id,
          supplierName: supplier.supplierName,
          email: supplier.email,
        },
      });
    } catch (error) {
      console.error("Error fetching public quote request:", error);
      res.status(500).json({ message: "Failed to fetch quote request" });
    }
  });

  // Submit a quote for a quote request (token-based access)
  app.post('/api/public/quote-requests/:id/submit-quote', validateQuoteAccessToken, async (req: any, res) => {
    try {
      const { id: requestId } = req.params;
      const { supplierId, requestSupplierId } = req.supplierAccess;
      const quoteData = req.body;

      // Validate required fields
      if (!quoteData.pricePerUnit || !quoteData.leadTime) {
        return res.status(400).json({ message: "Price and lead time are required" });
      }

      // Convert validityDate string to Date if provided (and not empty)
      let validityDate = null;
      if (quoteData.validityDate && quoteData.validityDate.trim() !== '') {
        validityDate = new Date(quoteData.validityDate);
      }

      // Create the supplier quote
      const quote = await storage.createSupplierQuote({
        requestId,
        supplierId,
        pricePerUnit: quoteData.pricePerUnit.toString(),
        currency: quoteData.currency || 'AUD',
        moq: quoteData.moq,
        leadTime: quoteData.leadTime,
        validityDate: validityDate,
        paymentTerms: quoteData.paymentTerms,
        additionalNotes: quoteData.additionalNotes,
        status: 'submitted',
      });

      // Update request-supplier relationship to mark quote as submitted
      await storage.updateRequestSupplier(requestSupplierId, {
        responseSubmittedAt: new Date(),
      });

      // Create notifications for admin/procurement users
      try {
        const supplier = await storage.getSupplier(supplierId);
        const quoteRequest = await storage.getQuoteRequest(requestId);
        
        if (supplier && quoteRequest) {
          await notificationService.notifyAdminsOfQuoteSubmission({
            supplierName: supplier.supplierName,
            requestNumber: quoteRequest.requestNumber,
            materialName: quoteRequest.materialName,
            quoteId: quote.id,
            requestId: requestId,
          });
        }
      } catch (notifyError) {
        console.error("Error sending quote submission notifications:", notifyError);
      }

      res.status(201).json({ message: "Quote submitted successfully", quote });
    } catch (error) {
      console.error("Error submitting quote:", error);
      res.status(500).json({ message: "Failed to submit quote" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Supplier Portal API - Demo Mode" });
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket notification service
  if (!process.env.VERCEL && process.env.ENABLE_WEBSOCKETS !== 'false') {
    notificationService.initialize(httpServer);
  }
  

  return httpServer;
}
