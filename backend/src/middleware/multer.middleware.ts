import multer, { diskStorage, FileFilterCallback, MulterError } from "multer";
import fs from "fs";
import path from "path";
import type { NextFunction, Request, Response } from "express";

import {
  AllowedFileTypes,
  DEFAULT_ALLOWED_TYPES,
  FILE_UPLOAD_CONFIG,
  generateUniqueFilename,
} from "@/validations/file.validation";
import logger from "@shared/logger";

/**
 * Absolute path to the temporary uploads directory.
 * Resolved once so it stays consistent regardless of the process CWD and
 * matches the directory used by the temp-file-cleanup worker.
 */
const uploadsDir = path.resolve("uploads");

/**
 * Multer disk storage configuration
 * Stores files temporarily in the uploads directory with timestamped filenames
 */
const storage = diskStorage({
  destination: (_req, _file, cb) => {
    // Ensure the uploads directory exists before writing. `recursive: true`
    // is idempotent (no error if it already exists) and guards against the
    // directory being absent on a fresh checkout/deploy or removed at runtime.
    fs.mkdir(uploadsDir, { recursive: true }, (err) => {
      cb(err, uploadsDir);
    });
  },
  filename: (_req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
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
  if (DEFAULT_ALLOWED_TYPES.includes(file.mimetype as AllowedFileTypes)) {
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
const uploadSingle = (fieldName: string) => upload.single(fieldName);

/**
 * Upload middleware for multiple files with same field name
 * @param fieldName - Form field name for the files
 * @param maxCount - Maximum number of files (default: 10)
 */
const uploadArray = (fieldName: string, maxCount: number = 10) =>
  upload.array(fieldName, maxCount);

/**
 * Upload middleware for multiple files with different field names
 * @param fields - Array of field configurations
 */
const uploadFields = (fields: multer.Field[]) => upload.fields(fields);

type ProfileUploadKind = "profilePicture" | "resume";

const profileUploadTypes: Record<
  ProfileUploadKind,
  Record<string, string[]>
> = {
  profilePicture: {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
  },
  resume: {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
  },
};

class UnsupportedUploadError extends Error {}

function uploadError(
  res: Response,
  status: number,
  code: string,
  message: string,
  fieldName: ProfileUploadKind,
): void {
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details: [{ field: `body.${fieldName}`, message }],
    },
  });
}

async function removeRejectedFile(file?: Express.Multer.File): Promise<void> {
  if (!file?.path) return;
  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    logger.warn({ error, path: file.path }, "Unable to remove rejected upload");
  }
}

function matchesFileSignature(mimetype: string, header: Buffer): boolean {
  if (mimetype === "image/jpeg") {
    return header.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }
  if (mimetype === "image/png") {
    return header
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimetype === "application/pdf") {
    return header.subarray(0, 5).toString() === "%PDF-";
  }
  if (mimetype === "application/msword") {
    return header
      .subarray(0, 8)
      .equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  }
  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    // DOCX is a ZIP container. The worker handles any deeper parsing failures.
    return header.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  }
  return false;
}

function profileUpload(fieldName: ProfileUploadKind) {
  const maxBytes = (fieldName === "profilePicture" ? 5 : 10) * 1024 * 1024;
  const types = profileUploadTypes[fieldName];
  const middleware = multer({
    storage,
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      const extensions = types[file.mimetype];
      if (
        !extensions?.includes(path.extname(file.originalname).toLowerCase())
      ) {
        cb(new UnsupportedUploadError(`Unsupported ${fieldName} file type`));
        return;
      }
      cb(null, true);
    },
  }).single(fieldName);

  return (req: Request, res: Response, next: NextFunction): void => {
    middleware(req, res, (error: unknown) => {
      void (async () => {
        if (error) {
          await removeRejectedFile(req.file);
          if (error instanceof MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
              uploadError(
                res,
                413,
                "FILE_TOO_LARGE",
                `${fieldName === "profilePicture" ? "Image" : "Resume"} exceeds the ${maxBytes / 1024 / 1024} MB limit`,
                fieldName,
              );
              return;
            }
            uploadError(res, 400, "INVALID_UPLOAD", error.message, fieldName);
            return;
          }
          if (error instanceof UnsupportedUploadError) {
            uploadError(
              res,
              415,
              "UNSUPPORTED_FILE_TYPE",
              error.message,
              fieldName,
            );
            return;
          }
          next(error);
          return;
        }

        const file = req.file;
        if (!file || file.size === 0) {
          await removeRejectedFile(file);
          uploadError(
            res,
            400,
            "FILE_REQUIRED",
            `A ${fieldName} file is required`,
            fieldName,
          );
          return;
        }

        try {
          const handle = await fs.promises.open(file.path, "r");
          const header = Buffer.alloc(8);
          try {
            await handle.read(header, 0, header.length, 0);
          } finally {
            await handle.close();
          }
          if (!matchesFileSignature(file.mimetype, header)) {
            await removeRejectedFile(file);
            uploadError(
              res,
              415,
              "INVALID_FILE_CONTENT",
              "File contents do not match its type",
              fieldName,
            );
            return;
          }
          next();
        } catch (validationError) {
          await removeRejectedFile(file);
          next(validationError);
        }
      })();
    });
  };
}

/**
 * Pre-configured upload middlewares for common use cases
 */
export const uploadMiddleware = {
  // Profile picture upload (single image)
  profilePicture: profileUpload("profilePicture"),

  // Resume upload (single PDF/DOC)
  resume: profileUpload("resume"),

  // Organization logo upload (single image)
  organizationLogo: uploadSingle("logo"),

  // Job application attachments (multiple files)
  applicationAttachments: uploadArray("attachments", 5),

  // Job application with resume and optional cover letter
  jobApplication: uploadFields([
    { name: "resume", maxCount: 1 },
    { name: "coverLetter", maxCount: 1 },
  ]),

  // Mixed file upload (different fields)
  mixedFiles: uploadFields([
    { name: "coverLetter", maxCount: 1 },
    { name: "certificates", maxCount: 4 },
  ]),

  // Generic document upload (multiple files)
  documents: uploadArray("documents", 10),
};
