import type {
  Certification,
  NewCertification,
} from "@/validations/certifications.validation";

export interface CertificationRepositoryPort {
  linkCertification(
    userProfileId: number,
    certificationData: NewCertification,
  ): Promise<Certification>;

  unlinkCertification(
    userProfileId: number,
    certificationId: number,
  ): Promise<boolean>;

  searchCertifications(query: string): Promise<Certification[]>;
}
