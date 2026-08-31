"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/common";
import type { Member } from "@/lib/types";
import type { AssignableMemberRole } from "@/schemas/invitations";
import { getMemberColumns, memberGlobalFilter } from "./member-columns";
import { RemoveMemberDialog } from "./RemoveMemberDialog";
import { ChangeMemberRoleDialog } from "./ChangeMemberRoleDialog";

interface MembersTableProps {
  members: Member[];
  canManageMembers: boolean;
  onRemoveMember: (memberId: number) => Promise<void>;
  onChangeMemberRole: (input: {
    memberId: number;
    role: AssignableMemberRole;
  }) => Promise<unknown>;
  isRemovePending?: boolean;
  isChangeRolePending?: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function MembersTable({
  members,
  canManageMembers,
  onRemoveMember,
  onChangeMemberRole,
  isRemovePending = false,
  isChangeRolePending = false,
  searchTerm,
  onSearchTermChange,
}: MembersTableProps) {
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [memberToChangeRole, setMemberToChangeRole] = useState<Member | null>(
    null,
  );
  const [removedMemberIds, setRemovedMemberIds] = useState<Set<number>>(
    new Set(),
  );
  const [roleOverrides, setRoleOverrides] = useState<
    Record<number, AssignableMemberRole>
  >({});

  const visibleMembers = useMemo(
    () =>
      members
        .filter((member) => !removedMemberIds.has(member.id))
        .map((member) => {
          const override = roleOverrides[member.id];
          return override ? { ...member, role: override } : member;
        }),
    [members, removedMemberIds, roleOverrides],
  );

  const columns = useMemo(
    () =>
      getMemberColumns({
        canManageMembers,
        onRequestRemove: setMemberToRemove,
        onRequestChangeRole: setMemberToChangeRole,
      }),
    [canManageMembers],
  );

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    try {
      await onRemoveMember(memberToRemove.id);
    } catch {
      return;
    }

    setRemovedMemberIds((previous) => new Set(previous).add(memberToRemove.id));
    setMemberToRemove(null);
  };

  const handleConfirmChangeRole = async (role: AssignableMemberRole) => {
    if (!memberToChangeRole) return;

    try {
      await onChangeMemberRole({
        memberId: memberToChangeRole.id,
        role,
      });
    } catch {
      return;
    }

    setRoleOverrides((previous) => ({
      ...previous,
      [memberToChangeRole.id]: role,
    }));
    setMemberToChangeRole(null);
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={visibleMembers}
        globalFilter={searchTerm}
        onGlobalFilterChange={onSearchTermChange}
        globalFilterFn={memberGlobalFilter}
      />

      <RemoveMemberDialog
        member={memberToRemove}
        open={memberToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null);
        }}
        onConfirm={handleConfirmRemove}
        isPending={isRemovePending}
      />

      <ChangeMemberRoleDialog
        member={memberToChangeRole}
        open={memberToChangeRole !== null}
        onOpenChange={(open) => {
          if (!open) setMemberToChangeRole(null);
        }}
        onConfirm={handleConfirmChangeRole}
        isPending={isChangeRolePending}
      />
    </>
  );
}
