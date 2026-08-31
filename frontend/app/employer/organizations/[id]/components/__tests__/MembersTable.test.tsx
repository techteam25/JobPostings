import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/test-utils";
import type { Member } from "@/lib/types";
import { MembersTable } from "../MembersTable";

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

describe("MembersTable", () => {
  const onRemoveMember = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    onRemoveMember.mockClear();
  });

  it("removes a member from the members table after confirmation", async () => {
    const user = userEvent.setup();
    const removableMember = createMember({
      id: 42,
      memberName: "Removable User",
      memberEmail: "removable@test.org",
    });

    render(
      <MembersTable
        members={[
          createMember({ id: 1, role: "owner", memberName: "Owner" }),
          removableMember,
        ]}
        canManageMembers
        onRemoveMember={onRemoveMember}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /actions for removable user/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /remove member/i }));
    await user.click(screen.getByRole("button", { name: /^remove member$/i }));

    await waitFor(() => {
      expect(onRemoveMember).toHaveBeenCalledWith(42);
    });
    await waitFor(() => {
      expect(screen.queryByText("Removable User")).not.toBeInTheDocument();
    });
  });

  it("keeps the member on the list when removal is cancelled", async () => {
    const user = userEvent.setup();
    const removableMember = createMember({
      id: 42,
      memberName: "Removable User",
    });

    render(
      <MembersTable
        members={[removableMember]}
        canManageMembers
        onRemoveMember={onRemoveMember}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /actions for removable user/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /remove member/i }));
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(screen.getByText("Removable User")).toBeInTheDocument();
    expect(onRemoveMember).not.toHaveBeenCalled();
  });

  it("shows an error and keeps the member when removal fails", async () => {
    const user = userEvent.setup();
    const failingRemove = vi.fn().mockRejectedValue(new Error("Failed"));
    const removableMember = createMember({
      id: 42,
      memberName: "Removable User",
    });

    render(
      <MembersTable
        members={[removableMember]}
        canManageMembers
        onRemoveMember={failingRemove}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /actions for removable user/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /remove member/i }));
    await user.click(screen.getByRole("button", { name: /^remove member$/i }));

    await waitFor(() => {
      expect(failingRemove).toHaveBeenCalledWith(42);
    });
    expect(screen.getByText("Removable User")).toBeInTheDocument();
  });

  it("does not offer remove actions without admin permission", async () => {
    render(
      <MembersTable
        members={[createMember({ memberName: "Regular Member" })]}
        canManageMembers={false}
        onRemoveMember={onRemoveMember}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /actions for regular member/i }),
    ).not.toBeInTheDocument();
  });

  it("does not offer remove for owners", async () => {
    render(
      <MembersTable
        members={[
          createMember({ id: 1, role: "owner", memberName: "Owner User" }),
        ]}
        canManageMembers
        onRemoveMember={onRemoveMember}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /actions for owner user/i }),
    ).not.toBeInTheDocument();
  });
});
