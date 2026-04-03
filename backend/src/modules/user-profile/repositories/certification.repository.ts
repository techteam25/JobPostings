import { and, eq, like, sql } from "drizzle-orm";
import { certifications, userCertifications } from "@/db/schema";
import { db } from "@shared/db/connection";
import { DatabaseError, NotFoundError } from "@shared/errors";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import { SecurityUtils } from "@shared/utils/security";
import type { CertificationRepositoryPort } from "../ports/certification-repository.port";
import type { NewCertification } from "@/validations/certifications.validation";

export class CertificationRepository implements CertificationRepositoryPort {
  async linkCertification(
    userProfileId: number,
    certificationData: NewCertification,
  ) {
    return await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const [record] = await tx
            .insert(certifications)
            .values(certificationData)
            .onDuplicateKeyUpdate({
              set: {
                certificationName: sql`values(${certifications.certificationName})`,
              },
            })
            .$returningId();

          if (!record || isNaN(record.id)) {
            throw new DatabaseError("Failed to create certification");
          }

          await tx
            .insert(userCertifications)
            .values({
              certificationId: record.id,
              userId: userProfileId,
            })
            .onDuplicateKeyUpdate({
              set: {
                certificationId: sql`values(${userCertifications.certificationId})`,
              },
            });

          const row = await tx.query.certifications.findFirst({
            where: eq(certifications.id, record.id),
          });

          if (!row) {
            throw new DatabaseError("Failed to retrieve linked certification");
          }

          return row;
        }),
    );
  }

  async unlinkCertification(userProfileId: number, certificationId: number) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .delete(userCertifications)
        .where(
          and(
            eq(userCertifications.userId, userProfileId),
            eq(userCertifications.certificationId, certificationId),
          ),
        );

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new NotFoundError("Certification", certificationId);
      }

      return true;
    });
  }

  async searchCertifications(query: string) {
    return await withDbErrorHandling(async () => {
      const escaped = SecurityUtils.escapeLikePattern(query);
      return db
        .select()
        .from(certifications)
        .where(like(certifications.certificationName, `%${escaped}%`))
        .limit(20);
    });
  }
}
