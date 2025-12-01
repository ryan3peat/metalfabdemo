-- Add new notification types to the enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quote_submitted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'document_uploaded';
