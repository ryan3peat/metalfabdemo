import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import localPassport from "./auth/localAuth";
import { hashPassword, validatePasswordComplexity } from "./auth/localAuth";
import { insertSupplierSchema } from "@shared/schema";
import { emailService, generateAccessToken, generateQuoteSubmissionUrl } from "./email/emailService";

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
      const user = await storage.getUser(userId);
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
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
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
      const request = await storage.getQuoteRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Quote request not found" });
      }

      res.json(request);
    } catch (error) {
      console.error("Error fetching quote request:", error);
      res.status(500).json({ message: "Failed to fetch quote request" });
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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Essential Flavours Supplier Portal API" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
