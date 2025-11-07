import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/config/firebase";
import { StorageFolder, UploadResult, StorageKey } from "@/types/storage.types";
import { AppError } from "@/utils/errors";
import logger from "@/logger";

export interface IStorageService {
  uploadFile(
    file: Express.Multer.File,
    userId: number,
    type: StorageFolder
  ): Promise<UploadResult>;
  deleteFile(path: string): Promise<void>;
  generateKey(
    folder: StorageFolder,
    userId: number,
    fileName: string
  ): StorageKey;
}

export class StorageService implements IStorageService {
  // Generate predictable, type-safe key
  generateKey(
    folder: StorageFolder,
    userId: number,
    fileName: string
  ): StorageKey {
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `storage:${folder}:user_${userId}/${safeFileName}_${timestamp}` as StorageKey;
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: number,
    type: StorageFolder
  ): Promise<UploadResult> {
    try {
      const fileName = file.originalname;
      const key = this.generateKey(type, userId, fileName);
      const path = `uploads/${type}/user_${userId}/${fileName}`;

      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file.buffer);
      const url = await getDownloadURL(snapshot.ref);

      logger.info({ key, path, userId, type }, "File uploaded");

      return { url, path, fileName };
    } catch (error) {
      logger.error({ error, userId, type }, "Upload failed");
      throw new AppError("Failed to upload file", 500);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
      logger.info({ path }, "File deleted");
    } catch (error: any) {
      if (error.code === "storage/object-not-found") {
        logger.warn({ path }, "File not found for deletion");
        return;
      }
      logger.error({ error, path }, "Delete failed");
      throw new AppError("Failed to delete file", 500);
    }
  }

    extractPathFromUrl(url: string): string | null {
    try {
      const decoded = decodeURIComponent(url);
      const match = decoded.match(/o\/(.+?)\?/);
      return match?.[1] ?? null;
    } catch {
      return null;
    }
  }
}

export const storageService = new StorageService();
