"use client";

import { X } from "lucide-react";

import { useFiltersStore } from "@/context/store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function RemoteOnlyBadge() {
  const remoteOnly = useFiltersStore((state) => state.remoteOnly);
  const setRemoteOnly = useFiltersStore((state) => state.setRemoteOnly);

  return remoteOnly ? (
    <Badge
      variant="secondary"
      className="hover:bg-secondary/80 hidden cursor-pointer rounded-full px-3 py-1 text-sm font-medium sm:inline-flex"
      onClick={() => setRemoteOnly(false)}
    >
      Remote Only <X className="ml-1 size-5" />
    </Badge>
  ) : (
    <Button
      className="text-secondary-foreground hover:bg-input bg-secondary hidden cursor-pointer rounded-full px-3 py-4 shadow-none sm:inline-flex"
      onClick={() => setRemoteOnly(true)}
    >
      Remote only
    </Button>
  );
}
