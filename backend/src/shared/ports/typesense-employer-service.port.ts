export interface EmployerDocument {
  id: string;
  name: string;
  logoUrl?: string;
  city?: string;
  state?: string;
}

export interface TypesenseEmployerServicePort {
  indexEmployerDocument(doc: EmployerDocument): Promise<void>;
  indexManyEmployerDocuments(docs: EmployerDocument[]): Promise<void>;
  updateEmployerDocument(
    id: string,
    updatedFields: Partial<EmployerDocument>,
  ): Promise<void>;
  deleteEmployerDocument(id: string): Promise<void>;
}
