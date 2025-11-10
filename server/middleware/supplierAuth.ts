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
export async function requireSupplierAccess(req: any, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const userEmail = getUserEmail(req);

    if (!userId || !userEmail) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    // Check if user email matches any supplier
    const supplier = await storage.getSupplierByEmail(userEmail);
    
    if (!supplier) {
      return res.status(403).json({ 
        message: "Access denied: You are not registered as a supplier in our system" 
      });
    }

    // Check if supplier has received at least one quote request
    const quoteRequests = await storage.getSupplierQuoteRequests(supplier.id);
    
    if (quoteRequests.length === 0) {
      return res.status(403).json({ 
        message: "Access denied: No quote requests found for your account" 
      });
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
