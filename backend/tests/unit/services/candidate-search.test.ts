import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { UserService } from "@/services/user.service";
import { UserRepository } from "@/repositories/user.repository";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { AppError, ValidationError } from "@/utils/errors";

// Mock dependencies
vi.mock("@/repositories/user.repository", () => {
  const UserRepository = vi.fn();
  UserRepository.prototype.searchCandidates = vi.fn();
  return { UserRepository };
});

vi.mock("@/repositories/organization.repository", () => {
  const OrganizationRepository = vi.fn();
  OrganizationRepository.prototype.canPostJobs = vi.fn();
  return { OrganizationRepository };
});

vi.mock("@/infrastructure/email.service");
vi.mock("@/infrastructure/queue.service");
vi.mock("@/services/audit.service");

describe("UserService - Candidate Search", () => {
  let userService: UserService;
  let mockUserRepository: any;
  let mockOrganizationRepository: any;

  beforeEach(() => {
    userService = new UserService();
    // Access the private properties which should be instances of the mocked classes
    mockUserRepository = (userService as any).userRepository;
    mockOrganizationRepository = (userService as any).organizationRepository;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return candidates when user is an organization member", async () => {
    // Arrange
    const filters = { q: "Developer", city: "Austin" };
    const requestingUserId = 1;
    const mockCandidates = {
      items: [{ id: 2, fullName: "John Doe" }],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };

    mockOrganizationRepository.canPostJobs.mockResolvedValue(true);
    mockUserRepository.searchCandidates.mockResolvedValue(mockCandidates);

    // Act
    const result = await userService.searchCandidates(filters, requestingUserId);

    // Assert
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toEqual(mockCandidates);
      expect(mockOrganizationRepository.canPostJobs).toHaveBeenCalledWith(requestingUserId);
      expect(mockUserRepository.searchCandidates).toHaveBeenCalledWith(filters);
    }
  });

  it("should fail when user is NOT an organization member", async () => {
    // Arrange
    const filters = { q: "", city: "" };
    const requestingUserId = 2;

    mockOrganizationRepository.canPostJobs.mockResolvedValue(false);

    // Act
    const result = await userService.searchCandidates(filters, requestingUserId);

    // Assert
    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(ValidationError);
    expect(result.error.message).toContain("Only organization members can search for candidates");
    expect(mockUserRepository.searchCandidates).not.toHaveBeenCalled();
  });

  it("should handle repository errors gracefully", async () => {
    // Arrange
    const filters = { q: "", city: "" };
    const requestingUserId = 1;

    mockOrganizationRepository.canPostJobs.mockResolvedValue(true);
    mockUserRepository.searchCandidates.mockRejectedValue(new Error("DB Connection Failed"));

    // Act
    const result = await userService.searchCandidates(filters, requestingUserId);

    // Assert
    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    // BaseService wraps unknown errors in DatabaseError or similar if not AppError? 
    // Wait, the catch block in service does: return fail(new DatabaseError("Failed to search candidates"));
    expect(result.error.message).toBe("Failed to search candidates");
  });
});
