import type { EmailServicePort } from "@shared/ports/email-service.port";
import type { OrgMembershipCommandPort } from "./ports/org-membership-command.port";
import type { UserEmailQueryPort } from "./ports/user-email-query.port";

import { InvitationsRepository } from "./repositories/invitations.repository";
import { InvitationsService } from "./services/invitations.service";
import { InvitationsController } from "./controllers/invitations.controller";
import { createInvitationsGuards } from "./guards/invitations.guards";
import { createInvitationExpirationWorker } from "./workers/invitation-expiration.worker";

interface InvitationsModuleDeps {
  orgMembership: OrgMembershipCommandPort;
  userEmailQuery: UserEmailQueryPort;
  emailService: EmailServicePort;
}

/**
 * Composition root for the Invitations module.
 *
 * Receives cross-module command/query ports and shared email service.
 */
export function createInvitationsModule(deps: InvitationsModuleDeps) {
  const repository = new InvitationsRepository();
  const service = new InvitationsService(
    repository,
    deps.orgMembership,
    deps.userEmailQuery,
    deps.emailService,
  );
  const controller = new InvitationsController(service);
  const guards = createInvitationsGuards({
    invitationsRepository: repository,
  });

  const workers = createInvitationExpirationWorker({
    invitationsRepository: repository,
  });

  return { controller, guards, repository, workers };
}

export type InvitationsModule = ReturnType<typeof createInvitationsModule>;
