"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFiltersStore } from "@/context/store";

export function RemoteOnlyFilter() {
  const remoteOnly = useFiltersStore((state) => state.remoteOnly);
  const setRemoteOnly = useFiltersStore((state) => state.setRemoteOnly);

  return (
    <div className="flex items-center justify-between space-x-2">
      <Label htmlFor="remote-only">Remote Only</Label>
      <Switch
        id="remote-only"
        onCheckedChange={setRemoteOnly}
        checked={remoteOnly}
      />
    </div>
  );
}
