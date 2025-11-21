import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CheckmarkOptionProps {
  label: string;
  checked: boolean;
  onCheckedChange: (option: string) => void;
}

export function CheckmarkOption({
  label,
  checked,
  onCheckedChange,
}: CheckmarkOptionProps) {
  return (
    <Button
      onClick={() => onCheckedChange(label)}
      className={cn(
        "hover:bg-accent flex w-full items-center justify-between px-4 py-3 text-center text-sm transition-all",
        "focus-visible:ring-ring text-foreground bg-transparent font-normal shadow-none focus:outline-none focus-visible:ring-2",
      )}
    >
      <span className={cn(checked && "font-medium")}>{label}</span>
      {checked && <Check className="mr-2 size-5" />}
    </Button>
  );
}
