import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Helper function to get user ID from either OIDC, local auth, or supplier magic link
function getUserId(req: any): string | undefined {
  if (req.user?.authType === "local") {
    return req.user.localAuthUser?.id;
  } else if (req.user?.authType === "supplier") {
    return req.user.supplierUser?.id;
  } else if (req.user?.claims) {
    return req.user.claims.sub;
  }
  return undefined;
}

// Helper function to get user email from either OIDC, local auth, or supplier magic link
function getUserEmail(req: any): string | undefined {
  if (req.user?.authType === "local") {
    return req.user.localAuthUser?.email;
  } else if (req.user?.authType === "supplier") {
    return req.user.supplierUser?.email;
  } else if (req.user?.claims) {
    return req.user.claims.email;
  }
  return undefined;
}

// Middleware to verify user is a registered supplier with quote requests
// Demo mode: Bypass checks and use first available supplier or create mock supplier
export async function requireSupplierAccess(req: any, res: Response, next: NextFunction) {
  try {
    // Demo mode: Bypass authentication checks
    const userId = "demo-admin-user"; // Use demo user ID
    
    // In demo mode, get the first supplier from database, or create a mock one
    const allSuppliers = await storage.getSuppliers();
    let supplier;
    
    if (allSuppliers.length > 0) {
      // Use the first supplier in demo mode
      supplier = allSuppliers[0];
    } else {
      // Create a mock supplier if none exist (for demo purposes)
      supplier = {
        id: "demo-supplier-id",
        supplierName: "Demo Metal Fabrication Supplier",
        contactPerson: "Demo Contact",
        email: "supplier@demo.com",
        email2: null,
        phone: null,
        location: null,
        moq: null,
        leadTimes: null,
        paymentTerms: null,
        certifications: [],
        active: true,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Attach supplier info to request for downstream handlers
    req.supplier = supplier;
    req.userId = userId;
    
    next();
  } catch (error) {
    console.error("Supplier auth middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
