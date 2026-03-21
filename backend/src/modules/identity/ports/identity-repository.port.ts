import { UpdateUser, User } from "@/validations/userProfile.validation";

export interface IdentityRepositoryPort {
  findByEmail(email: string): Promise<User | undefined>;
  findByIdWithPassword(id: number): Promise<User | undefined>;
  findUserById(id: number): Promise<User | undefined>;
  deactivateUserAccount(
    id: number,
    data: { status: "active" | "deactivated" | "deleted" },
  ): Promise<User | undefined>;
  update(id: number, data: UpdateUser): Promise<boolean>;
  findById(id: number): Promise<User | undefined>;
  findDeactivatedUserIds(): Promise<number[]>;
}
