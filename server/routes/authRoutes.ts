import express from 'express';
import type { Request, Response } from 'express';
import { storage } from '../storage';
import { emailService } from '../email/hybridEmailService';
import { generateMagicLinkToken, hashToken, normalizeEmail } from '../auth/magicLink';
import { createRateLimiter, createEmailRateLimiter } from '../auth/rateLimiter';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userType?: 'admin' | 'supplier';
  }
}

const router = express.Router();

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const MAGIC_LINK_EXPIRY_MS = MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000;

const ipRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'magic-link-ip',
});

const emailRateLimiter = createEmailRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 3,
  keyPrefix: 'magic-link-email',
});

router.post('/request-magic-link', ipRateLimiter, emailRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = normalizeEmail(email);

    const supplier = await storage.getSupplierByEmail(normalizedEmail);

    if (!supplier) {
      return res.status(200).json({
        message: 'If an account exists with that email, a login link has been sent.',
      });
    }

    const { token, tokenHash } = generateMagicLinkToken();

    const magicLink = await storage.createMagicLink({
      email: normalizedEmail,
      tokenHash,
      expiresAt: new Date(Date.now() + MAGIC_LINK_EXPIRY_MS),
    });

    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';
    
    const magicLinkUrl = `${baseUrl}/verify-login?token=${token}`;

    const emailResult = await emailService.sendMagicLinkEmail(
      normalizedEmail,
      supplier.supplierName,
      {
        magicLink: magicLinkUrl,
        expiryMinutes: MAGIC_LINK_EXPIRY_MINUTES,
      }
    );

    if (!emailResult.success) {
      console.error('Failed to send magic link email:', emailResult.error);
      return res.status(500).json({
        message: 'Failed to send login link. Please try again later.',
      });
    }

    await storage.cleanupExpiredMagicLinks();

    return res.status(200).json({
      message: 'If an account exists with that email, a login link has been sent.',
    });
  } catch (error) {
    console.error('Error requesting magic link:', error);
    return res.status(500).json({
      message: 'An error occurred. Please try again later.',
    });
  }
});

router.get('/verify-magic-link', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const tokenHash = hashToken(token);

    const magicLink = await storage.getMagicLinkByTokenHash(tokenHash);

    if (!magicLink) {
      return res.status(400).json({ 
        message: 'Invalid or expired login link',
        expired: true,
      });
    }

    if (magicLink.usedAt) {
      return res.status(400).json({ 
        message: 'This login link has already been used',
        expired: true,
      });
    }

    if (new Date() > magicLink.expiresAt) {
      return res.status(400).json({ 
        message: 'This login link has expired',
        expired: true,
      });
    }

    const supplier = await storage.getSupplierByEmail(magicLink.email);

    if (!supplier) {
      return res.status(400).json({ 
        message: 'Supplier account not found',
        expired: true,
      });
    }

    // Get or create user record for the supplier
    let user = await storage.getUserByEmail(magicLink.email);
    
    if (!user) {
      // Create a user record for the supplier
      const contactPerson = supplier.contactPerson || '';
      const nameParts = contactPerson.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      user = await storage.upsertUser({
        email: magicLink.email,
        firstName,
        lastName,
        role: 'supplier',
        companyName: supplier.supplierName,
        active: true,
      });
    }

    // Create proper passport session
    req.login({ supplierUser: user, authType: 'supplier' }, async (err) => {
      if (err) {
        console.error('Error creating session:', err);
        return res.status(500).json({
          message: 'Failed to create session',
        });
      }

      // Only mark as used after successful session creation
      try {
        await storage.markMagicLinkAsUsed(magicLink.id);
      } catch (markError) {
        console.error('Error marking magic link as used:', markError);
        // Session is created, so this is non-critical
      }

      return res.status(200).json({
        success: true,
        supplier: {
          id: supplier.id,
          email: supplier.email,
          supplierName: supplier.supplierName,
        },
      });
    });
    return;
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return res.status(500).json({
      message: 'An error occurred during verification',
    });
  }
});

export default router;