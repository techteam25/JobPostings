import multer from "multer";

/**
 * Multer configuration for file uploads
 * Uses memory storage for Firebase Storage integration
 */

// Configure memory storage (files stored in memory as Buffer objects)
const storage = multer.memoryStorage();

// File filter for allowed file types
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allowed MIME types for resumes and cover letters
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "text/plain", // .txt
  ];

  // Allowed MIME types for profile images
  const allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const allAllowedTypes = [...allowedMimeTypes, ...allowedImageTypes];

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPEG, PNG, WEBP`
      )
    );
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size (will be checked more specifically in middleware)
  },
});

// Predefined upload configurations for different use cases
export const uploadConfigs = {
  // For application files (resume + cover letter)
  applicationFiles: upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "coverLetter", maxCount: 1 },
  ]),

  // For profile image upload
  profileImage: upload.single("profileImage"),

  // For resume only
  resumeOnly: upload.single("resume"),

  // For cover letter only
  coverLetterOnly: upload.single("coverLetter"),
};

export default upload;