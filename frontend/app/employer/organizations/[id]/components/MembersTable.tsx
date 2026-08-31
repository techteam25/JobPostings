"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/common";
import type { Member } from "@/lib/types";
import { getMemberColumns, memberGlobalFilter } from "./member-columns";
import { RemoveMemberDialog } from "./RemoveMemberDialog";

interface MembersTableProps {
  members: Member[];
  canManageMembers: boolean;
  onRemoveMember: (memberId: number) => Promise<void>;
  isRemovePending?: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function MembersTable({
  members,
  canManageMembers,
  onRemoveMember,
  isRemovePending = false,
  searchTerm,
  onSearchTermChange,
}: MembersTableProps) {
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [removedMemberIds, setRemovedMemberIds] = useState<Set<number>>(
    new Set(),
  );

  const visibleMembers = useMemo(
    () => members.filter((member) => !removedMemberIds.has(member.id)),
    [members, removedMemberIds],
  );

  const columns = useMemo(
    () =>
      getMemberColumns({
        canManageMembers,
        onRequestRemove: setMemberToRemove,
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
    </>
  );
}
