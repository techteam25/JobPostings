import { and, eq, lt } from "drizzle-orm";

import { organizationInvitations, organizationMembers } from "@/db/schema";
import { db } from "@shared/db/connection";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import { DatabaseError } from "@shared/errors";
import type { InvitationsRepositoryPort } from "../ports/invitations-repository.port";

/**
 * Repository class for managing invitation-related database operations.
 * Does not extend BaseRepository as invitations do not need generic CRUD.
 */
export class InvitationsRepository implements InvitationsRepositoryPort {
  /**
   * Finds an invitation by token.
   * @param token The invitation token.
   * @returns The invitation with organization and inviter details.
   */
  async findInvitationByToken(token: string) {
    return await withDbErrorHandling(async () => {
      return await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.token, token),
        with: {
          organization: {
            columns: {
              id: true,
              name: true,
            },
          },
          inviter: {
            columns: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });
    });
  }

  /**
   * Finds an invitation by email and organization ID.
   * @param email The invitee email.
   * @param organizationId The organization ID.
   * @returns The invitation if found.
   */
  async findInvitationByEmailAndOrg(email: string, organizationId: number) {
    return await withDbErrorHandling(async () => {
      return await db.query.organizationInvitations.findFirst({
        where: and(
          eq(organizationInvitations.email, email.toLowerCase()),
          eq(organizationInvitations.organizationId, organizationId),
        ),
      });
    });
  }

  /**
   * Creates a new invitation.
   * @param data The invitation data.
   * @returns The created invitation.
   */
  async createInvitation(data: {
    organizationId: number;
    email: string;
    role: "owner" | "admin" | "recruiter" | "member";
    token: string;
    invitedBy: number;
    expiresAt: Date;
  }) {
    return await withDbErrorHandling(async () => {
      const [insertResult] = await db
        .insert(organizationInvitations)
        .values({
          organizationId: data.organizationId,
          email: data.email.toLowerCase(),
          role: data.role,
          token: data.token,
          invitedBy: data.invitedBy,
          expiresAt: data.expiresAt,
          status: "pending",
        })
        .$returningId();

      if (!insertResult) {
        throw new DatabaseError("Failed to create invitation");
      }

      return await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.id, insertResult.id),
      });
    });
  }

  /**
   * Updates an invitation (for resend/reactivation).
   * @param invitationId The invitation ID.
   * @param data The update data.
   * @returns The updated invitation.
   */
  async updateInvitation(
    invitationId: number,
    data: {
      token: string;
      expiresAt: Date;
      status?: "pending" | "accepted" | "expired" | "cancelled";
    },
  ) {
    return await withDbErrorHandling(async () => {
      await db
        .update(organizationInvitations)
        .set({
          token: data.token,
          expiresAt: data.expiresAt,
          status: data.status || "pending",
          updatedAt: new Date(),
        })
        .where(eq(organizationInvitations.id, invitationId));

      return await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.id, invitationId),
      });
    });
  }

  /**
   * Updates invitation status.
   * @param invitationId The invitation ID.
   * @param data The status update data.
   * @returns The updated invitation.
   */
  async updateInvitationStatus(
    invitationId: number,
    data: {
      status: "accepted" | "cancelled" | "expired";
      acceptedAt?: Date;
      cancelledAt?: Date;
      cancelledBy?: number;
      expiredAt?: Date;
    },
  ) {
    return await withDbErrorHandling(async () => {
      await db
        .update(organizationInvitations)
        .set({
          status: data.status,
          acceptedAt: data.acceptedAt,
          cancelledAt: data.cancelledAt,
          cancelledBy: data.cancelledBy,
          expiredAt: data.expiredAt,
          updatedAt: new Date(),
        })
        .where(eq(organizationInvitations.id, invitationId));

      return await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.id, invitationId),
      });
    });
  }

  /**
   * Finds an invitation by ID.
   * @param invitationId The invitation ID.
   * @returns The invitation if found.
   */
  async findInvitationById(invitationId: number) {
    return await withDbErrorHandling(async () => {
      return await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.id, invitationId),
      });
    });
  }

  /**
   * Checks if an email is already an active member of an organization.
   * @param email The email to check.
   * @param organizationId The organization ID.
   * @returns True if email is an active member, false otherwise.
   */
  async isEmailActiveMember(email: string, organizationId: number) {
    return await withDbErrorHandling(async () => {
      const members = await db.query.organizationMembers.findMany({
        where: and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.isActive, true),
        ),
        with: {
          user: {
            columns: {
              email: true,
            },
          },
        },
      });

      return members.some(
        (member) => member.user.email.toLowerCase() === email.toLowerCase(),
      );
    });
  }

  /**
   * Expires all pending invitations that have passed their expiration date.
   * Updates invitation status to 'expired' and sets expiredAt timestamp.
   * @returns The number of expired invitations.
   */
  async expirePendingInvitations(): Promise<number> {
    return await withDbErrorHandling(async () => {
      const now = new Date();

      const result = await db
        .update(organizationInvitations)
        .set({
          status: "expired",
          expiredAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(organizationInvitations.status, "pending"),
            lt(organizationInvitations.expiresAt, now),
          ),
        );

      return result[0].affectedRows;
    });
  }
}
