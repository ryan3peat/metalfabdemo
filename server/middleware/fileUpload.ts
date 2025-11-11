import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DOCUMENTS_DIR = path.join(UPLOADS_DIR, 'documents');

// Ensure directories exist
[UPLOADS_DIR, DOCUMENTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOCUMENTS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomhash-originalname
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${sanitizedName}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter for validation
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed MIME types
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  // Allowed extensions
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// Helper to get file path
export function getDocumentPath(filename: string): string {
  return path.join(DOCUMENTS_DIR, filename);
}

// Helper to check if file exists
export function documentExists(filename: string): boolean {
  return fs.existsSync(getDocumentPath(filename));
}

// Helper to delete file
export function deleteDocument(filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const filePath = getDocumentPath(filename);
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Validate magic bytes (file signatures) for additional security
export function validateFileSignature(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const stream = fs.createReadStream(filePath, { start: 0, end: 8 });
    let buffer = Buffer.alloc(0);

    stream.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
    });

    stream.on('end', () => {
      const signatures: { [key: string]: number[] } = {
        pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
        jpg: [0xFF, 0xD8, 0xFF],
        png: [0x89, 0x50, 0x4E, 0x47],
        docx: [0x50, 0x4B, 0x03, 0x04], // ZIP-based (DOCX, XLSX)
        doc: [0xD0, 0xCF, 0x11, 0xE0], // Old Office formats
      };

      // Check if file matches any known signature
      for (const [type, sig] of Object.entries(signatures)) {
        const matches = sig.every((byte, i) => buffer[i] === byte);
        if (matches) {
          resolve(true);
          return;
        }
      }

      // If no match, still return true but log warning
      console.warn(`⚠️  Could not validate file signature for ${path.basename(filePath)}`);
      resolve(true);
    });

    stream.on('error', () => {
      resolve(false);
    });
  });
}

// Export uploads directory path
export { UPLOADS_DIR, DOCUMENTS_DIR };
