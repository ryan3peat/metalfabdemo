import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

/**
 * Middleware to validate access tokens for quote submission
 * Checks if token exists, is valid, and hasn't expired
 */
export async function validateQuoteAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { token } = req.query;
    const { id: requestId } = req.params;

    if (!token || typeof token !== 'string') {
      return res.status(401).json({ message: 'Access token required' });
    }

    if (!requestId) {
      return res.status(400).json({ message: 'Request ID required' });
    }

    // Get all request-supplier relationships for this request
    const requestSuppliers = await storage.getRequestSuppliers(requestId);
    
    // Find the relationship matching this token
    const validAccess = requestSuppliers.find(
      rs => rs.accessToken === token
    );

    if (!validAccess) {
      return res.status(401).json({ message: 'Invalid access token' });
    }

    // Check if token has expired
    if (validAccess.tokenExpiresAt && new Date() > new Date(validAccess.tokenExpiresAt)) {
      return res.status(401).json({ message: 'Access token has expired' });
    }

    // Attach supplier info to request for use in route handlers
    (req as any).supplierAccess = {
      supplierId: validAccess.supplierId,
      requestId: validAccess.requestId,
      requestSupplierId: validAccess.id,
    };

    next();
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ message: 'Failed to validate access token' });
  }
}
