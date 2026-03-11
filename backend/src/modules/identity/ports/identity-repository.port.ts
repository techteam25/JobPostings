import type { User } from "@/validations/userProfile.validation";

export interface IdentityRepositoryPort {
  findByEmail(email: string): Promise<User | undefined>;
  findByIdWithPassword(id: number): Promise<User | undefined>;
  findUserById(id: number): Promise<
    | {
        id: number;
        email: string;
        fullName: string;
        emailVerified: boolean;
        status: string;
        deletedAt: Date | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }
    | undefined
  >;
  deactivateUserAccount(
    id: number,
    data: { status: "active" | "deactivated" | "deleted" },
  ): Promise<any>;
  update(id: number, data: any): Promise<boolean>;
  findById(id: number): Promise<any>;
}
