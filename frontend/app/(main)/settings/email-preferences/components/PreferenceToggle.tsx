"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PreferenceToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export default function PreferenceToggle({
  label,
  description,
  enabled,
  disabled,
  onToggle,
}: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <Label className="text-base font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={enabled} disabled={disabled} onCheckedChange={onToggle} />
    </div>
  );
}
