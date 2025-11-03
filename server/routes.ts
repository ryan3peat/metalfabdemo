import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import localPassport from "./auth/localAuth";
import { hashPassword, validatePasswordComplexity } from "./auth/localAuth";
import { insertSupplierSchema } from "@shared/schema";

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

  // Raw Materials Routes
  app.get('/api/raw-materials', isAuthenticated, async (req: any, res) => {
    try {
      const materials = await storage.getRawMaterials();
      res.json(materials);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      res.status(500).json({ message: "Failed to fetch raw materials" });
    }
  });

  app.get('/api/raw-materials/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const material = await storage.getRawMaterial(id);
      
      if (!material) {
        return res.status(404).json({ message: "Raw material not found" });
      }

      res.json(material);
    } catch (error) {
      console.error("Error fetching raw material:", error);
      res.status(500).json({ message: "Failed to fetch raw material" });
    }
  });

  app.post('/api/raw-materials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'procurement') {
        return res.status(403).json({ message: "Forbidden: Admin or procurement access required" });
      }

      const material = await storage.createRawMaterial(req.body);
      res.status(201).json(material);
    } catch (error) {
      console.error("Error creating raw material:", error);
      res.status(500).json({ message: "Failed to create raw material" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Essential Flavours Supplier Portal API" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
