import type { FileMetadata } from "@/validations/file.validation";

export interface FileMetadataUpdatePort {
  updateEntityFileMetadata(
    entityType: "job" | "organization" | "user",
    entityId: string,
    urls: string[],
    metadata: FileMetadata[],
    mergeWithExisting: boolean,
    tempFiles?: Array<{ fieldName?: string }>,
  ): Promise<void>;
}
