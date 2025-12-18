import multer, { diskStorage, FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

import {
  DEFAULT_ALLOWED_TYPES,
  FILE_UPLOAD_CONFIG,
} from "@/validations/file.validation";

/**
 * Multer disk storage configuration
 * Stores files temporarily in the uploads directory with timestamped filenames
 */
const storage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    // Create a safe filename
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${timestamp}-${safeName}${ext}`);
  },
});

/**
 * File filter to validate file types
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (DEFAULT_ALLOWED_TYPES.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Allowed types: ${DEFAULT_ALLOWED_TYPES.join(", ")}`,
      ),
    );
  }
};

/**
 * Base multer configuration
 */
const multerConfig: multer.Options = {
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_UPLOAD_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024, // Convert MB to bytes
    files: 10, // Maximum number of files per request
  },
};

/**
 * Multer instance with default configuration
 */
const upload = multer(multerConfig);

/**
 * Upload middleware for single file uploads
 * @param fieldName - Form field name for the file
 */
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

/**
 * Upload middleware for multiple files with same field name
 * @param fieldName - Form field name for the files
 * @param maxCount - Maximum number of files (default: 10)
 */
export const uploadArray = (fieldName: string, maxCount: number = 10) =>
  upload.array(fieldName, maxCount);

/**
 * Upload middleware for multiple files with different field names
 * @param fields - Array of field configurations
 */
export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);

/**
 * Upload middleware for any file field
 */
export const uploadAny = () => upload.any();

/**
 * Pre-configured upload middlewares for common use cases
 */
export const uploadMiddleware = {
  // Profile picture upload (single image)
  profilePicture: upload.single("profilePicture"),

  // Resume upload (single PDF/DOC)
  resume: upload.single("resume"),

  // Organization logo upload (single image)
  organizationLogo: upload.single("logo"),

  // Job application attachments (multiple files)
  applicationAttachments: upload.array("attachments", 5),

  // Generic document upload (multiple files)
  documents: upload.array("documents", 10),
};

export default upload;
