import { describe, it, expect, vi, beforeEach } from "vitest";
import { IdentityToNotificationsAdapter } from "@shared/adapters/identity-to-notifications.adapter";

describe("IdentityToNotificationsAdapter", () => {
  let adapter: IdentityToNotificationsAdapter;
  let mockIdentityRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockIdentityRepository = {
      findUserById: vi.fn(),
      findDeactivatedUserIds: vi.fn(),
    };

    adapter = new IdentityToNotificationsAdapter(mockIdentityRepository);
  });

  describe("getInactiveUserIds", () => {
    it("should return deactivated user IDs from the repository", async () => {
      mockIdentityRepository.findDeactivatedUserIds.mockResolvedValue([
        1, 5, 12,
      ]);

      const result = await adapter.getInactiveUserIds();

      expect(result).toEqual([1, 5, 12]);
      expect(
        mockIdentityRepository.findDeactivatedUserIds,
      ).toHaveBeenCalledOnce();
    });

    it("should return empty array when no deactivated users exist", async () => {
      mockIdentityRepository.findDeactivatedUserIds.mockResolvedValue([]);

      const result = await adapter.getInactiveUserIds();

      expect(result).toEqual([]);
    });
  });

  describe("getUserContactInfo", () => {
    it("should return email and fullName when user exists", async () => {
      mockIdentityRepository.findUserById.mockResolvedValue({
        id: 1,
        email: "john@example.com",
        fullName: "John Doe",
        status: "active",
        image: null,
        emailVerified: true,
        deletedAt: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await adapter.getUserContactInfo(1);

      expect(result).toEqual({
        email: "john@example.com",
        fullName: "John Doe",
      });
      expect(mockIdentityRepository.findUserById).toHaveBeenCalledWith(1);
    });

    it("should return null when user does not exist", async () => {
      mockIdentityRepository.findUserById.mockResolvedValue(undefined);

      const result = await adapter.getUserContactInfo(999);

      expect(result).toBeNull();
    });
  });
});
