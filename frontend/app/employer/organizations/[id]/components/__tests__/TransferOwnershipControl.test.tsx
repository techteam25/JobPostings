import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/test-utils";
import type { Member } from "@/lib/types";
import { TransferOwnershipControl } from "../TransferOwnershipControl";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 2,
    organizationId: 10,
    userId: 200,
    role: "member",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    memberName: "Member User",
    memberEmail: "member@test.org",
    memberEmailVerified: true,
    memberStatus: "active",
    ...overrides,
  };
}

const owner = createMember({
  id: 1,
  userId: 100,
  role: "owner",
  memberName: "Owner User",
});

const admin = createMember({
  id: 3,
  userId: 300,
  role: "admin",
  memberName: "Ada Admin",
  memberEmail: "ada@test.org",
});

describe("TransferOwnershipControl", () => {
  const onTransferOwnership = vi.fn().mockResolvedValue(undefined);
  const onTransferred = vi.fn();

  beforeEach(() => {
    onTransferOwnership.mockClear();
    onTransferOwnership.mockResolvedValue(undefined);
    onTransferred.mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("confirms transfer with outcome copy and succeeds with toast", async () => {
    const user = userEvent.setup();

    render(
      <TransferOwnershipControl
        members={[owner, admin]}
        currentUserId={100}
        onTransferOwnership={onTransferOwnership}
        onTransferred={onTransferred}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /transfer ownership/i }),
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /ada admin/i }));

    expect(screen.getByText(/you will become an admin/i)).toBeInTheDocument();
    expect(screen.getByText(/lose owner-only settings/i)).toBeInTheDocument();
    expect(
      screen.getByText(/new owner can transfer ownership back/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /^transfer ownership$/i }),
    );

    await waitFor(() => {
      expect(onTransferOwnership).toHaveBeenCalledWith(3);
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/Ada Admin.*admin/i),
      );
    });
    expect(onTransferred).toHaveBeenCalled();
  });

  it("keeps the dialog open and shows an error when transfer fails", async () => {
    const user = userEvent.setup();
    const failingTransfer = vi
      .fn()
      .mockRejectedValue(
        new Error("Ownership can only be transferred to another active admin."),
      );

    render(
      <TransferOwnershipControl
        members={[owner, admin]}
        currentUserId={100}
        onTransferOwnership={failingTransfer}
        onTransferred={onTransferred}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /transfer ownership/i }),
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /ada admin/i }));
    await user.click(
      screen.getByRole("button", { name: /^transfer ownership$/i }),
    );

    await waitFor(() => {
      expect(failingTransfer).toHaveBeenCalledWith(3);
    });
    expect(
      screen.getByText(
        /ownership can only be transferred to another active admin/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^transfer ownership$/i }),
    ).toBeInTheDocument();
    expect(onTransferred).not.toHaveBeenCalled();
  });

  it("disables transfer when the owner is the only active member", () => {
    render(
      <TransferOwnershipControl
        members={[owner]}
        currentUserId={100}
        onTransferOwnership={onTransferOwnership}
        onTransferred={onTransferred}
      />,
    );

    expect(
      screen.getByRole("button", { name: /transfer ownership/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        /invite someone, make them an admin, then transfer — or delete the organization/i,
      ),
    ).toBeInTheDocument();
  });

  it("disables transfer when other members exist but none are admin", () => {
    render(
      <TransferOwnershipControl
        members={[
          owner,
          createMember({
            id: 4,
            userId: 400,
            role: "recruiter",
            memberName: "Recruiter",
          }),
          createMember({
            id: 5,
            userId: 500,
            role: "member",
            memberName: "Plain Member",
          }),
        ]}
        currentUserId={100}
        onTransferOwnership={onTransferOwnership}
        onTransferred={onTransferred}
      />,
    );

    expect(
      screen.getByRole("button", { name: /transfer ownership/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/change a member’s role to admin, then transfer/i),
    ).toBeInTheDocument();
  });

  it("excludes inactive admins and the owner from successors", async () => {
    const user = userEvent.setup();
    const inactiveAdmin = createMember({
      id: 6,
      userId: 600,
      role: "admin",
      isActive: false,
      memberName: "Inactive Admin",
    });

    render(
      <TransferOwnershipControl
        members={[owner, admin, inactiveAdmin]}
        currentUserId={100}
        onTransferOwnership={onTransferOwnership}
        onTransferred={onTransferred}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /transfer ownership/i }),
    );
    await user.click(screen.getByRole("combobox"));

    expect(
      screen.getByRole("option", { name: /ada admin/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /inactive admin/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /owner user/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render for non-owners", () => {
    render(
      <TransferOwnershipControl
        members={[owner, admin]}
        currentUserId={300}
        onTransferOwnership={onTransferOwnership}
        onTransferred={onTransferred}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /transfer ownership/i }),
    ).not.toBeInTheDocument();
  });
});
