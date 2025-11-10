import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import localPassport from "./auth/localAuth";
import { hashPassword, validatePasswordComplexity } from "./auth/localAuth";
import { insertSupplierSchema, insertSupplierQuoteSchema } from "@shared/schema";
import { generateAccessToken, generateQuoteSubmissionUrl } from "./email/emailService";
import { emailService } from "./email/hybridEmailService";
import { validateQuoteAccessToken } from "./middleware/tokenAuth";
import { requireSupplierAccess } from "./middleware/supplierAuth";

// Helper function to get user ID from either OIDC or local auth
function getUserId(req: any): string | undefined {
  if (req.user?.authType === "local") {
    return req.user.localAuthUser?.id;
  } else if (req.user?.claims) {
    return req.user.claims.sub;
  }
  return undefined;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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

  app.post('/api/local/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('[LocalAuth] Logout error:', err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Set password route (admin only - for initial setup)
  app.post('/api/local/set-password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin') {
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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      let user = await storage.getUser(userId);
      
      // For OIDC users logging in for the first time, create user record
      if (!user && req.user?.claims) {
        const claims = req.user.claims;
        
        // Check if the user's email exists in the suppliers database
        const supplier = await storage.getSupplierByEmail(claims.email);
        
        if (!supplier) {
          // User is not a registered supplier - deny access
          console.log(`[Auth] Access denied for ${claims.email} - not a registered supplier`);
          return res.status(403).json({ 
            message: "Access denied. Only registered suppliers can access this portal. Please contact Essential Flavours if you believe this is an error.",
            code: "NOT_REGISTERED_SUPPLIER"
          });
        }
        
        // Supplier is registered - create user account with supplier role
        console.log(`[Auth] Creating supplier account for ${claims.email} (Supplier: ${supplier.supplierName})`);
        
        // Safely extract first/last name from contact person if available
        const contactPerson = supplier.contactPerson || '';
        const nameParts = contactPerson.split(' ');
        const fallbackFirstName = nameParts[0] || 'User';
        const fallbackLastName = nameParts.slice(1).join(' ') || '';
        
        user = await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name || claims.given_name || fallbackFirstName,
          lastName: claims.last_name || claims.family_name || fallbackLastName,
          role: 'supplier',
          active: true,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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

  // Supplier management routes (admin/procurement only)
  app.get('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      console.log('[DEBUG /api/suppliers] userId:', userId, 'currentUser:', JSON.stringify(currentUser));
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
        console.log('[DEBUG /api/suppliers] Access denied - role:', currentUser?.role);
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
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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

  app.post('/api/quote-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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
                casNumber: quoteRequest.casNumber || undefined,
                femaNumber: quoteRequest.femaNumber || undefined,
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
    } catch (error) {
      console.error("Error creating quote request:", error);
      res.status(500).json({ message: "Failed to create quote request" });
    }
  });

  app.post('/api/quote-requests/draft', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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

  // Admin dashboard statistics
  app.get('/api/admin/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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
      
      const outstanding = quoteRequests.filter(qr => 
        qr.quote && qr.quote.preliminaryApprovalStatus === 'pending'
      );
      
      const expired = quoteRequests.filter(qr => 
        !qr.quote && new Date(qr.request.submitByDate) <= now
      );

      const approved = quoteRequests.filter(qr =>
        qr.quote && qr.quote.preliminaryApprovalStatus === 'approved'
      );

      res.json({
        totalRequests: quoteRequests.length,
        ongoing: ongoing.length,
        outstanding: outstanding.length,
        expired: expired.length,
        approved: approved.length,
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
      const transformed = quoteRequests.map(qr => ({
        ...qr.request,
        requestSupplier: qr.requestSupplier,
        quote: qr.quote,
        isExpired: new Date(qr.request.submitByDate) <= now,
        hasQuote: !!qr.quote,
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

      // Get existing quote if any
      const [existingQuote] = await storage.getSupplierQuotes(requestId);

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
      const userId = req.userId;
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

        // Update request_suppliers to mark response as submitted
        const requestSuppliers = await storage.getRequestSuppliers(requestId);
        const requestSupplier = requestSuppliers.find(rs => rs.supplierId === supplier.id);
        
        if (requestSupplier) {
          await storage.updateRequestSupplier(requestSupplier.id, {
            responseSubmittedAt: new Date(),
          });
        }
      }

      res.json(quote);
    } catch (error) {
      console.error("Error submitting supplier quote:", error);
      res.status(500).json({ message: "Failed to submit quote" });
    }
  });

  // Get documents for a quote
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
      res.json(documents);
    } catch (error) {
      console.error("Error fetching supplier documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Upload a document for a quote (placeholder - actual upload will use object storage)
  app.post('/api/supplier/quotes/:quoteId/documents', isAuthenticated, requireSupplierAccess, async (req: any, res) => {
    try {
      const supplier = req.supplier;
      const userId = req.userId;
      const { quoteId } = req.params;
      const { documentType, fileUrl, fileName, fileSize, mimeType } = req.body;

      // Verify supplier owns this quote
      const quote = await storage.getSupplierQuote(quoteId);
      if (!quote || quote.supplierId !== supplier.id) {
        return res.status(403).json({ message: "Access denied to this quote" });
      }

      // Verify quote has preliminary approval
      if (quote.preliminaryApprovalStatus !== 'approved') {
        return res.status(403).json({ 
          message: "Documents can only be uploaded after preliminary approval" 
        });
      }

      const document = await storage.createSupplierDocument({
        supplierQuoteId: quoteId,
        documentType,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        uploadedBy: userId,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading supplier document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Delete a document
  app.delete('/api/supplier/documents/:documentId', isAuthenticated, requireSupplierAccess, async (req: any, res) => {
    try {
      const supplier = req.supplier;
      const { documentId } = req.params;

      // Get document to verify ownership
      const documents = await storage.getSupplierDocuments(''); // We need to get the document first
      // TODO: Add getSupplierDocument(id) method to storage
      
      // For now, just delete - proper ownership check will be added with object storage integration
      await storage.deleteSupplierDocument(documentId);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting supplier document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Admin: Update preliminary approval status for a quote
  app.patch('/api/supplier/quotes/:quoteId/preliminary-approval', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const { quoteId } = req.params;
      const { status } = req.body; // 'approved' or 'rejected'

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid approval status" });
      }

      const quote = await storage.updateSupplierQuote(quoteId, {
        preliminaryApprovalStatus: status,
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
          casNumber: request.casNumber,
          femaNumber: request.femaNumber,
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

      // Convert validityDate string to Date if provided
      if (quoteData.validityDate) {
        quoteData.validityDate = new Date(quoteData.validityDate);
      }

      // Create the supplier quote
      const quote = await storage.createSupplierQuote({
        requestId,
        supplierId,
        pricePerUnit: quoteData.pricePerUnit.toString(),
        currency: quoteData.currency || 'AUD',
        moq: quoteData.moq,
        leadTime: quoteData.leadTime,
        validityDate: quoteData.validityDate,
        paymentTerms: quoteData.paymentTerms,
        additionalNotes: quoteData.additionalNotes,
        status: 'submitted',
      });

      // Update request-supplier relationship to mark quote as submitted
      await storage.updateRequestSupplier(requestSupplierId, {
        responseSubmittedAt: new Date(),
      });

      res.status(201).json({ message: "Quote submitted successfully", quote });
    } catch (error) {
      console.error("Error submitting quote:", error);
      res.status(500).json({ message: "Failed to submit quote" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Essential Flavours Supplier Portal API" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
