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
  const onChangeMemberRole = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    onRemoveMember.mockClear();
    onChangeMemberRole.mockClear();
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
        onChangeMemberRole={onChangeMemberRole}
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
        onChangeMemberRole={onChangeMemberRole}
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
        onChangeMemberRole={onChangeMemberRole}
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

  it("does not offer member actions without admin permission", async () => {
    render(
      <MembersTable
        members={[createMember({ memberName: "Regular Member" })]}
        canManageMembers={false}
        onRemoveMember={onRemoveMember}
        onChangeMemberRole={onChangeMemberRole}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /actions for regular member/i }),
    ).not.toBeInTheDocument();
  });

  it("does not offer actions for owners", async () => {
    render(
      <MembersTable
        members={[
          createMember({ id: 1, role: "owner", memberName: "Owner User" }),
        ]}
        canManageMembers
        onRemoveMember={onRemoveMember}
        onChangeMemberRole={onChangeMemberRole}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /actions for owner user/i }),
    ).not.toBeInTheDocument();
  });

  it("changes a member role from the members actions", async () => {
    const user = userEvent.setup();
    const targetMember = createMember({
      id: 42,
      role: "member",
      memberName: "Role Change User",
    });

    render(
      <MembersTable
        members={[targetMember]}
        canManageMembers
        onRemoveMember={onRemoveMember}
        onChangeMemberRole={onChangeMemberRole}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />,
    );

    expect(screen.getByText("member")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /actions for role change user/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /change role/i }));
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /^recruiter$/i }));
    await user.click(screen.getByRole("button", { name: /^save role$/i }));

    await waitFor(() => {
      expect(onChangeMemberRole).toHaveBeenCalledWith({
        memberId: 42,
        role: "recruiter",
      });
    });
    await waitFor(() => {
      expect(screen.getByText("recruiter")).toBeInTheDocument();
    });
    expect(screen.queryByText("member")).not.toBeInTheDocument();
  });

  it("keeps the old role when role change fails", async () => {
    const user = userEvent.setup();
    const failingChange = vi.fn().mockRejectedValue(new Error("Failed"));
    const targetMember = createMember({
      id: 42,
      role: "member",
      memberName: "Role Change User",
    });

    render(
      <MembersTable
        members={[targetMember]}
        canManageMembers
        onRemoveMember={onRemoveMember}
        onChangeMemberRole={failingChange}
        searchTerm=""
        onSearchTermChange={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /actions for role change user/i }),
    );
    await user.click(screen.getByRole("menuitem", { name: /change role/i }));
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /^admin$/i }));
    await user.click(screen.getByRole("button", { name: /^save role$/i }));

    await waitFor(() => {
      expect(failingChange).toHaveBeenCalledWith({
        memberId: 42,
        role: "admin",
      });
    });
    expect(screen.getByText("member")).toBeInTheDocument();
    expect(screen.queryByText("admin")).not.toBeInTheDocument();
  });
});
