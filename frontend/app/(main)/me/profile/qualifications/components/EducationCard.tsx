import { GraduationCap, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Education } from "@/lib/types";
import { formatDate } from "./utils";

interface EducationCardProps {
  education: Education;
}

export function EducationCard({ education }: EducationCardProps) {
  const startFormatted = formatDate(education.startDate);
  const endFormatted = education.endDate
    ? formatDate(education.endDate)
    : "Present";

  return (
    <div className="hover:bg-accent/50 flex gap-4 rounded-lg border p-4 transition-colors">
      <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
        <GraduationCap className="text-primary size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">{education.schoolName}</h3>
            <p className="text-muted-foreground text-sm">
              {education.program} in {education.major}
            </p>
          </div>
          {education.graduated && (
            <Badge variant="secondary" className="shrink-0">
              Graduated
            </Badge>
          )}
        </div>
        <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
          <Calendar className="size-3.5" />
          <span>
            {startFormatted} — {endFormatted}
          </span>
        </div>
      </div>
    </div>
  );
}
