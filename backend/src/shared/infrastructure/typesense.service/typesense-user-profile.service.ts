import { typesenseClient } from "@shared/config/typesense-client";
import { USER_PROFILES_COLLECTION } from "@shared/infrastructure/typesense.service/constants";
import type {
  TypesenseUserProfileServicePort,
  UserProfileDocument,
} from "@shared/ports/typesense-user-profile-service.port";

export class TypesenseUserProfileService implements TypesenseUserProfileServicePort {
  async upsertUserProfile(doc: UserProfileDocument): Promise<void> {
    await typesenseClient
      .collections(USER_PROFILES_COLLECTION)
      .documents()
      .upsert(doc);
  }

  async deleteUserProfile(userId: string): Promise<void> {
    await typesenseClient
      .collections(USER_PROFILES_COLLECTION)
      .documents(userId)
      .delete();
  }
}
