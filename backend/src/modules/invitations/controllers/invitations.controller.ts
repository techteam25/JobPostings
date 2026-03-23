import { Request, Response } from "express";
import { BaseController } from "@shared/base/base.controller";
import { ApiResponse, EmptyBody } from "@shared/types";
import type {
  CreateOrganizationInvitationInput,
  GetOrganizationInvitationDetailsInput,
  AcceptOrganizationInvitationInput,
  CancelOrganizationInvitationInput,
} from "@/validations/organization.validation";
import type { InvitationsServicePort } from "@/modules/invitations";

/**
 * Controller class for handling invitation-related API endpoints.
 */
export class InvitationsController extends BaseController {
  constructor(private invitationsService: InvitationsServicePort) {
    super();
  }

  /**
   * Sends an invitation to join an organization.
   * @param req The Express request object with organization ID and invitation data.
   * @param res The Express response object.
   */
  sendInvitation = async (
    req: Request<
      CreateOrganizationInvitationInput["params"],
      EmptyBody,
      CreateOrganizationInvitationInput["body"]
    >,
    res: Response<ApiResponse<{ invitationId: number; message: string }>>,
  ) => {
    // Note: Authentication is validated by middleware before this method is called.
    const organizationId = parseInt(req.params.organizationId);
    const { email, role } = req.body;

    const result = await this.invitationsService.sendInvitation(
      organizationId,
      email,
      role,
      req.userId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, result.value, result.value.message, 201);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Gets invitation details by token (public endpoint).
   * @param req The Express request object with invitation token.
   * @param res The Express response object.
   */
  getInvitationDetails = async (
    req: Request<GetOrganizationInvitationDetailsInput["params"]>,
    res: Response<
      ApiResponse<{
        organizationName: string;
        role: string;
        inviterName: string;
        expiresAt: Date;
      }>
    >,
  ) => {
    const { token, organizationId } = req.params;

    const result = await this.invitationsService.getInvitationDetails(
      token,
      parseInt(organizationId),
    );

    if (result.isSuccess) {
      return this.sendSuccess(
        res,
        result.value,
        "Invitation details retrieved successfully",
      );
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Accepts an organization invitation (authenticated endpoint).
   * @param req The Express request object with invitation token.
   * @param res The Express response object.
   */
  acceptInvitation = async (
    req: Request<AcceptOrganizationInvitationInput["params"]>,
    res: Response<ApiResponse<{ message: string }>>,
  ) => {
    // Note: Authentication is validated by middleware before this method is called.
    const { token, organizationId } = req.params;

    const result = await this.invitationsService.acceptInvitation(
      token,
      req.userId!,
      parseInt(organizationId),
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, result.value, result.value.message, 200);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };

  /**
   * Cancels an organization invitation (authenticated endpoint, admin/owner only).
   * @param req The Express request object with organization ID and invitation ID.
   * @param res The Express response object.
   */
  cancelInvitation = async (
    req: Request<CancelOrganizationInvitationInput["params"]>,
    res: Response<ApiResponse<{ message: string }>>,
  ) => {
    // Note: Authentication is validated by middleware before this method is called.
    const invitationId = parseInt(req.params.invitationId);

    const result = await this.invitationsService.cancelInvitation(
      invitationId,
      req.userId!,
    );

    if (result.isSuccess) {
      return this.sendSuccess(res, result.value, result.value.message, 200);
    } else {
      return this.handleControllerError(res, result.error);
    }
  };
}
