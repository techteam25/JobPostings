import { describe, it, expect, vi, beforeEach } from "vitest";
import { IdentityService } from "@/modules/identity/services/identity.service";
import { ValidationError, DatabaseError, NotFoundError } from "@shared/errors";

vi.mock("@shared/infrastructure/queue.service", () => ({
  queueService: {
    addJob: vi.fn().mockResolvedValue(undefined),
  },
  QUEUE_NAMES: {
    EMAIL_QUEUE: "email-queue",
  },
}));

vi.mock("@/utils/auth", () => ({
  auth: {
    api: {
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
    },
  },
}));

describe("IdentityService", () => {
  let identityService: IdentityService;
  let mockIdentityRepository: any;
  let mockEmailService: any;
  let mockEventBus: any;
  let mockOrgOwnershipQuery: any;

  const emptyWalkAway = { blocking: [], willBeDeleted: [] };

  beforeEach(() => {
    vi.clearAllMocks();

    mockIdentityRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findUserById: vi.fn(),
      update: vi.fn(),
      deactivateUserAccount: vi.fn(),
      findDeactivatedUserIds: vi.fn(),
    };

    mockEmailService = {
      sendAccountDeactivationConfirmation: vi.fn().mockResolvedValue(undefined),
      sendAccountDeletionConfirmation: vi.fn().mockResolvedValue(undefined),
    };

    mockEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    mockOrgOwnershipQuery = {
      classifyOwnedOrgs: vi.fn().mockResolvedValue(emptyWalkAway),
      teardownSoloOrgs: vi.fn().mockResolvedValue("completed"),
    };

    identityService = new IdentityService(
      mockIdentityRepository,
      mockEmailService,
      mockEventBus,
      mockOrgOwnershipQuery,
    );
  });

  describe("deactivateSelf", () => {
    it("should deactivate own account successfully", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        fullName: "Test User",
        status: "active",
      };
      mockIdentityRepository.findById.mockResolvedValue(mockUser);
      mockIdentityRepository.deactivateUserAccount.mockResolvedValue(mockUser);

      const result = await identityService.deactivateSelf(1);

      expect(result.isSuccess).toBe(true);
      expect(
        mockEmailService.sendAccountDeactivationConfirmation,
      ).toHaveBeenCalledWith(1, "test@example.com", "Test User");
      expect(mockOrgOwnershipQuery.teardownSoloOrgs).not.toHaveBeenCalled();
    });

    it("should fail when user not found", async () => {
      mockIdentityRepository.findById.mockResolvedValue(undefined);

      const result = await identityService.deactivateSelf(999);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should fail when account is already deactivated", async () => {
      mockIdentityRepository.findById.mockResolvedValue({
        id: 1,
        status: "deactivated",
      });

      const result = await identityService.deactivateSelf(1);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("already deactivated");
      }
    });

    it("refuses deactivate when any blocking org exists and does not tear down solo orgs", async () => {
      mockIdentityRepository.findById.mockResolvedValue({
        id: 1,
        status: "active",
      });
      const classification = {
        blocking: [{ id: 10, name: "Team Org", hasActiveAdmin: true }],
        willBeDeleted: [{ id: 22, name: "Solo Org", hasActiveAdmin: false }],
      };
      mockOrgOwnershipQuery.classifyOwnedOrgs.mockResolvedValue(classification);

      const result = await identityService.deactivateSelf(1);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.details).toEqual(classification);
      }
      expect(mockOrgOwnershipQuery.teardownSoloOrgs).not.toHaveBeenCalled();
      expect(
        mockIdentityRepository.deactivateUserAccount,
      ).not.toHaveBeenCalled();
    });

    it("tears down solo orgs then deactivates when nothing blocks", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        fullName: "Test User",
        status: "active",
      };
      mockIdentityRepository.findById.mockResolvedValue(mockUser);
      mockIdentityRepository.deactivateUserAccount.mockResolvedValue(mockUser);
      mockOrgOwnershipQuery.classifyOwnedOrgs.mockResolvedValue({
        blocking: [],
        willBeDeleted: [
          { id: 22, name: "Solo Org", hasActiveAdmin: false },
          { id: 33, name: "Another Solo", hasActiveAdmin: false },
        ],
      });
      mockOrgOwnershipQuery.teardownSoloOrgs.mockResolvedValue("completed");

      const result = await identityService.deactivateSelf(1);

      expect(result.isSuccess).toBe(true);
      expect(mockOrgOwnershipQuery.teardownSoloOrgs).toHaveBeenCalledWith(
        1,
        [22, 33],
      );
      expect(mockIdentityRepository.deactivateUserAccount).toHaveBeenCalled();
    });

    it("aborts deactivate when teardown finds a new active member", async () => {
      mockIdentityRepository.findById.mockResolvedValue({
        id: 1,
        status: "active",
        email: "test@example.com",
        fullName: "Test User",
      });
      mockOrgOwnershipQuery.classifyOwnedOrgs
        .mockResolvedValueOnce({
          blocking: [],
          willBeDeleted: [{ id: 22, name: "Solo Org", hasActiveAdmin: false }],
        })
        .mockResolvedValueOnce({
          blocking: [{ id: 22, name: "Solo Org", hasActiveAdmin: false }],
          willBeDeleted: [],
        });
      mockOrgOwnershipQuery.teardownSoloOrgs.mockResolvedValue("aborted");

      const result = await identityService.deactivateSelf(1);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.details).toEqual({
          blocking: [{ id: 22, name: "Solo Org", hasActiveAdmin: false }],
          willBeDeleted: [],
        });
      }
      expect(
        mockIdentityRepository.deactivateUserAccount,
      ).not.toHaveBeenCalled();
    });
  });

  describe("deactivateUser", () => {
    it("should not allow deactivating own account", async () => {
      const result = await identityService.deactivateUser(1, 1);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("cannot deactivate your own");
      }
    });

    it("should fail when target user not found", async () => {
      mockIdentityRepository.findById.mockResolvedValue(undefined);

      const result = await identityService.deactivateUser(2, 1);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });

    it("should fail when user is already deactivated", async () => {
      mockIdentityRepository.findById.mockResolvedValue({
        id: 2,
        status: "deactivated",
      });

      const result = await identityService.deactivateUser(2, 1);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("activateUser", () => {
    it("should fail when user is already active", async () => {
      mockIdentityRepository.findById.mockResolvedValue({
        id: 1,
        status: "active",
      });

      const result = await identityService.activateUser(1);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain("already active");
      }
    });

    it("should fail when user not found", async () => {
      mockIdentityRepository.findById.mockResolvedValue(undefined);

      const result = await identityService.activateUser(999);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe("getWalkAwayOrgs", () => {
    it("returns blocking and will-be-deleted orgs from the ownership port", async () => {
      const classification = {
        blocking: [{ id: 10, name: "Acme Missions", hasActiveAdmin: true }],
        willBeDeleted: [
          { id: 22, name: "Beacon Outreach", hasActiveAdmin: false },
        ],
      };
      mockOrgOwnershipQuery.classifyOwnedOrgs.mockResolvedValue(classification);

      const result = await identityService.getWalkAwayOrgs(1);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(classification);
      }
      expect(mockOrgOwnershipQuery.classifyOwnedOrgs).toHaveBeenCalledWith(1);
    });

    it("returns empty lists when the user owns no orgs", async () => {
      mockOrgOwnershipQuery.classifyOwnedOrgs.mockResolvedValue(emptyWalkAway);

      const result = await identityService.getWalkAwayOrgs(1);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(emptyWalkAway);
      }
    });

    it("wraps database errors into a DatabaseError failure", async () => {
      mockOrgOwnershipQuery.classifyOwnedOrgs.mockRejectedValue(
        new Error("DB Error"),
      );

      const result = await identityService.getWalkAwayOrgs(1);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
