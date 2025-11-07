export type StorageFolder = "resumes" | "cover-letters" | "profile-images";

export type UploadType = "resume" | "coverLetter" | "profileImage";

export type UploadResult = {
  url: string;
  path: string; 
  fileName: string;
};

export type StorageKey = `storage:${StorageFolder}:${string}`;