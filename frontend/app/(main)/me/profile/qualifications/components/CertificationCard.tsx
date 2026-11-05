import { Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Certification } from "@/lib/types";

interface CertificationCardProps {
  certification: Certification;
  onRemove?: (certification: Certification) => void;
}

export function CertificationCard({
  certification,
  onRemove,
}: CertificationCardProps) {
  return (
    <div className="hover:bg-accent/50 flex gap-4 rounded-lg border p-4 transition-colors">
      <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
        <Award className="text-primary size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold">
          {certification.certificationName}
        </h3>
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-8 shrink-0"
          onClick={() => onRemove(certification)}
        >
          <X />
          <span className="sr-only">
            Remove {certification.certificationName}
          </span>
        </Button>
      )}
    </div>
  );
}
