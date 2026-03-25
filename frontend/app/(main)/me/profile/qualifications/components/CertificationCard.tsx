import { Award } from "lucide-react";
import type { Certification } from "@/lib/types";

interface CertificationCardProps {
  certification: Certification;
}

export function CertificationCard({ certification }: CertificationCardProps) {
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
    </div>
  );
}
