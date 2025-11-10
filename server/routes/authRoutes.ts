import express from 'express';
import type { Request, Response } from 'express';
import { storage } from '../storage';
import { emailService } from '../email/hybridEmailService';
import { generateMagicLinkToken, hashToken, normalizeEmail } from '../auth/magicLink';
import { createRateLimiter, createEmailRateLimiter } from '../auth/rateLimiter';
import { getBaseUrl } from '../utils/baseUrl';
import { setPasswordSchema } from '@shared/passwordValidation';
import bcrypt from 'bcrypt';

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

    const baseUrl = getBaseUrl();
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

// Password setup endpoint - verify token and set password
router.post('/setup-password', ipRateLimiter, async (req: Request, res: Response) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Validate password using schema
    const validationResult = setPasswordSchema.safeParse({ password, confirmPassword });
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Password validation failed',
        errors: validationResult.error.errors,
      });
    }

    const tokenHash = hashToken(token);
    const setupLink = await storage.getMagicLinkByTokenHash(tokenHash);

    if (!setupLink) {
      return res.status(400).json({
        message: 'Invalid or expired password setup link',
        expired: true,
      });
    }

    // Verify it's a password_setup token
    if (setupLink.type !== 'password_setup') {
      return res.status(400).json({
        message: 'Invalid token type',
      });
    }

    if (setupLink.usedAt) {
      return res.status(400).json({
        message: 'This password setup link has already been used',
        expired: true,
      });
    }

    if (new Date() > setupLink.expiresAt) {
      return res.status(400).json({
        message: 'This password setup link has expired',
        expired: true,
      });
    }

    // Get the user
    const user = await storage.getUserByEmail(setupLink.email);
    if (!user) {
      return res.status(400).json({
        message: 'User account not found',
      });
    }

    // Hash password with bcrypt cost factor 12 (architect recommendation)
    const passwordHash = await bcrypt.hash(validationResult.data.password, 12);

    // Atomically set password and mark token as used (prevents race condition)
    const result = await storage.setPasswordAndConsumeToken(user.id, passwordHash, setupLink.id);

    if (!result.success) {
      // Check if it was a "token already used" error (race condition caught)
      if (result.error === 'Token already used') {
        return res.status(400).json({
          message: 'This password setup link has already been used',
          expired: true,
        });
      }

      console.error('Error setting password:', result.error);
      return res.status(500).json({
        message: 'Failed to set password. Please try again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password set successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Error in password setup:', error);
    return res.status(500).json({
      message: 'An error occurred during password setup',
    });
  }
});

export default router;