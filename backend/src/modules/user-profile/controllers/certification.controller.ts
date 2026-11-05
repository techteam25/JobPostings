import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import type { CertificationServicePort } from "../ports/certification-service.port";
import type {
  LinkCertificationInput,
  UnlinkCertificationInput,
  SearchCertificationsInput,
} from "@/validations/certifications.validation";
import type { EmptyBody } from "@shared/types";

export class CertificationController extends BaseController {
  constructor(private certificationService: CertificationServicePort) {
    super();
  }

  linkCertification = async (
    req: Request<EmptyBody, EmptyBody, LinkCertificationInput["body"]>,
    res: Response,
  ) => {
    const result = await this.certificationService.linkCertification(
      req.userId!,
      req.body,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Certification linked successfully",
        201,
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  unlinkCertification = async (
    req: Request<UnlinkCertificationInput["params"]>,
    res: Response,
  ) => {
    const certificationId = Number(req.params.certificationId);

    const result = await this.certificationService.unlinkCertification(
      req.userId!,
      certificationId,
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Certification unlinked successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  searchCertifications = async (
    req: Request<
      EmptyBody,
      EmptyBody,
      EmptyBody,
      SearchCertificationsInput["query"]
    >,
    res: Response,
  ) => {
    const result = await this.certificationService.searchCertifications(
      req.query.q,
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, result.value, "Certifications found");
    } else {
      return this.handleControllerError(res, result.error);
    }
  };
}
