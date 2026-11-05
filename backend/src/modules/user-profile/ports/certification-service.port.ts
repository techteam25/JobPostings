import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type {
  Certification,
  NewCertification,
} from "@/validations/certifications.validation";

export interface CertificationServicePort {
  linkCertification(
    userId: number,
    certificationData: NewCertification,
  ): Promise<Result<Certification, AppError>>;

  unlinkCertification(
    userId: number,
    certificationId: number,
  ): Promise<Result<boolean, AppError>>;

  searchCertifications(
    query: string,
  ): Promise<Result<Certification[], AppError>>;
}
