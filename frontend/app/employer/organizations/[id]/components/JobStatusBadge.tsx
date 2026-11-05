import { Badge } from "@/components/ui/badge";
import { Job } from "@/schemas/responses/jobs";

interface JobStatusBadgeProps {
  job: Job;
}

export function JobStatusBadge({ job }: JobStatusBadgeProps) {
  if (!job.isActive) {
    return (
      <Badge className="border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20">
        Expired
      </Badge>
    );
  }

  if (job.applicationDeadline) {
    const deadline = new Date(job.applicationDeadline);
    const now = new Date();
    const daysUntil = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntil <= 7 && daysUntil >= 0) {
      return (
        <Badge className="border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200">
          Expiring
        </Badge>
      );
    }
  }

  return (
    <Badge className="border-accent/80 bg-accent/10 text-accent/80 hover:bg-accent/20">
      Active
    </Badge>
  );
}
