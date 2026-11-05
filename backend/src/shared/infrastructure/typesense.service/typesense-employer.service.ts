import { typesenseClient } from "@shared/config/typesense-client";
import { EMPLOYERS_COLLECTION } from "@shared/infrastructure/typesense.service/constants";
import type {
  EmployerDocument,
  TypesenseEmployerServicePort,
} from "@shared/ports/typesense-employer-service.port";

export class TypesenseEmployerService implements TypesenseEmployerServicePort {
  async indexEmployerDocument(doc: EmployerDocument): Promise<void> {
    await typesenseClient
      .collections(EMPLOYERS_COLLECTION)
      .documents()
      .create(doc);
  }

  async indexManyEmployerDocuments(docs: EmployerDocument[]): Promise<void> {
    await typesenseClient
      .collections(EMPLOYERS_COLLECTION)
      .documents()
      .import(docs, { action: "upsert" });
  }

  async updateEmployerDocument(
    id: string,
    updatedFields: Partial<EmployerDocument>,
  ): Promise<void> {
    await typesenseClient
      .collections(EMPLOYERS_COLLECTION)
      .documents(id)
      .update(updatedFields);
  }

  async deleteEmployerDocument(id: string): Promise<void> {
    await typesenseClient
      .collections(EMPLOYERS_COLLECTION)
      .documents(id)
      .delete();
  }
}
