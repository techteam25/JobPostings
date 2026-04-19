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
      findSoleOwnedOrgs: vi.fn().mockResolvedValue([]),
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

  describe("getBlockingOwnedOrgs", () => {
    it("returns the sole-owned orgs from the ownership query", async () => {
      const orgs = [
        { id: 10, name: "Acme Missions" },
        { id: 22, name: "Beacon Outreach" },
      ];
      mockOrgOwnershipQuery.findSoleOwnedOrgs.mockResolvedValue(orgs);

      const result = await identityService.getBlockingOwnedOrgs(1);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(orgs);
      }
      expect(mockOrgOwnershipQuery.findSoleOwnedOrgs).toHaveBeenCalledWith(1);
    });

    it("returns an empty array when the user owns no blocking orgs", async () => {
      mockOrgOwnershipQuery.findSoleOwnedOrgs.mockResolvedValue([]);

      const result = await identityService.getBlockingOwnedOrgs(1);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual([]);
      }
    });

    it("wraps database errors into a DatabaseError failure", async () => {
      mockOrgOwnershipQuery.findSoleOwnedOrgs.mockRejectedValue(
        new Error("DB Error"),
      );

      const result = await identityService.getBlockingOwnedOrgs(1);

      expect(result.isSuccess).toBe(false);
      if (!result.isSuccess) {
        expect(result.error).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
