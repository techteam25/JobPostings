import { fail, ok } from "@shared/result";
import { BaseService } from "@shared/base/base.service";
import type { CertificationServicePort } from "../ports/certification-service.port";
import type { CertificationRepositoryPort } from "../ports/certification-repository.port";
import type { ProfileRepositoryPort } from "@/modules/user-profile";
import { AppError, DatabaseError, NotFoundError } from "@shared/errors";
import type { NewCertification } from "@/validations/certifications.validation";

export class CertificationService
  extends BaseService
  implements CertificationServicePort
{
  constructor(
    private certificationRepository: CertificationRepositoryPort,
    private profileRepository: Pick<
      ProfileRepositoryPort,
      "findByIdWithProfile"
    >,
  ) {
    super();
  }

  async linkCertification(userId: number, certificationData: NewCertification) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new DatabaseError("User profile not found"));
      }

      const result = await this.certificationRepository.linkCertification(
        user.profile.id,
        certificationData,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to link certification"));
    }
  }

  async unlinkCertification(userId: number, certificationId: number) {
    try {
      const user = await this.profileRepository.findByIdWithProfile(userId);
      if (!user) {
        return fail(new NotFoundError("User", userId));
      }

      if (!user.profile) {
        return fail(new DatabaseError("User profile not found"));
      }

      const result = await this.certificationRepository.unlinkCertification(
        user.profile.id,
        certificationId,
      );

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to unlink certification"));
    }
  }

  async searchCertifications(query: string) {
    try {
      const result =
        await this.certificationRepository.searchCertifications(query);

      return ok(result);
    } catch (error) {
      if (error instanceof AppError) {
        return this.handleError(error);
      }
      return fail(new DatabaseError("Failed to search certifications"));
    }
  }
}
