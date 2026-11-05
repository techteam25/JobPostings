import { db } from "@shared/db/connection";
import { eq } from "drizzle-orm";
import { jobApplications, organizations, userProfile } from "@/db/schema";
import type { FileMetadata } from "@/validations/file.validation";
import type { FileMetadataUpdatePort } from "@shared/ports/file-metadata-update.port";

/**
 * Adapter that implements FileMetadataUpdatePort by updating file metadata
 * across three entity tables (job applications, organizations, user profiles).
 *
 * Encapsulates the cross-module DB logic that was previously inlined in
 * the file-upload worker, keeping the worker free of direct table imports.
 */
export class FileMetadataUpdateAdapter implements FileMetadataUpdatePort {
  async updateEntityFileMetadata(
    entityType: "job" | "organization" | "user",
    entityId: string,
    urls: string[],
    metadata: FileMetadata[],
    mergeWithExisting: boolean,
    tempFiles?: Array<{ fieldName?: string }>,
  ): Promise<void> {
    const id = parseInt(entityId, 10);

    switch (entityType) {
      case "job": {
        if (mergeWithExisting) {
          const existing = await db.query.jobApplications.findFirst({
            where: eq(jobApplications.id, id),
            columns: { fileMetadata: true },
          });
          const existingMetadata =
            (existing?.fileMetadata as FileMetadata[]) || [];
          metadata = [...existingMetadata, ...metadata];
        }

        const updateData: Record<string, unknown> = { fileMetadata: metadata };

        if (tempFiles) {
          tempFiles.forEach((file, index) => {
            if (urls[index]) {
              if (file.fieldName === "coverLetter") {
                updateData.coverLetterUrl = urls[index];
              } else {
                updateData.resumeUrl = urls[index];
              }
            }
          });
        } else {
          updateData.resumeUrl = urls[0] || null;
        }

        await db
          .update(jobApplications)
          .set(updateData)
          .where(eq(jobApplications.id, id));
        break;
      }
      case "organization": {
        if (mergeWithExisting) {
          const existing = await db.query.organizations.findFirst({
            where: eq(organizations.id, id),
            columns: { fileMetadata: true },
          });
          const existingMetadata =
            (existing?.fileMetadata as FileMetadata[]) || [];
          metadata = [...existingMetadata, ...metadata];
        }
        await db
          .update(organizations)
          .set({ fileMetadata: metadata, logoUrl: urls[0] || null })
          .where(eq(organizations.id, id));
        break;
      }
      case "user": {
        if (mergeWithExisting) {
          const existing = await db.query.userProfile.findFirst({
            where: eq(userProfile.id, id),
            columns: { fileMetadata: true },
          });
          const existingMetadata = Array.isArray(existing?.fileMetadata)
            ? (existing.fileMetadata as FileMetadata[])
            : [];
          metadata = [...existingMetadata, ...metadata];
        }

        const updateData: Record<string, unknown> = { fileMetadata: metadata };

        if (tempFiles) {
          tempFiles.forEach((file, index) => {
            if (urls[index]) {
              if (file.fieldName === "resume") {
                updateData.resumeUrl = urls[index];
              } else {
                updateData.profilePicture = urls[index];
              }
            }
          });
        } else {
          updateData.profilePicture = urls[0] || null;
        }

        await db
          .update(userProfile)
          .set(updateData)
          .where(eq(userProfile.id, id));
        break;
      }
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
}
