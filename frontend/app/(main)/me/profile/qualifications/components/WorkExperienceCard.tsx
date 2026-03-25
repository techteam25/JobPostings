import { Briefcase, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WorkExperience } from "@/lib/types";
import { formatDate } from "./utils";

interface WorkExperienceCardProps {
  experience: WorkExperience;
}

export function WorkExperienceCard({ experience }: WorkExperienceCardProps) {
  const startFormatted = formatDate(experience.startDate);
  const endFormatted = experience.endDate
    ? formatDate(experience.endDate)
    : "Present";

  return (
    <div className="hover:bg-accent/50 flex gap-4 rounded-lg border p-4 transition-colors">
      <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
        <Briefcase className="text-primary size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">{experience.jobTitle}</h3>
            <p className="text-muted-foreground text-sm">
              {experience.companyName}
            </p>
          </div>
          {experience.current && (
            <Badge
              variant="default"
              className="shrink-0 bg-green-100 text-green-800 hover:bg-green-100"
            >
              Current
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
