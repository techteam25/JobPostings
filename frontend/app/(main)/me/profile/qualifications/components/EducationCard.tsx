import {
  GraduationCap,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Education } from "@/lib/types";
import { formatDate } from "./utils";

interface EducationCardProps {
  education: Education;
  onEdit?: (education: Education) => void;
  onDelete?: (education: Education) => void;
}

export function EducationCard({
  education,
  onEdit,
  onDelete,
}: EducationCardProps) {
  const startFormatted = formatDate(education.startDate);
  const endFormatted = education.endDate
    ? formatDate(education.endDate)
    : "Present";

  const hasActions = onEdit || onDelete;

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
          <div className="flex shrink-0 items-center gap-2">
            {education.graduated && (
              <Badge variant="secondary">Graduated</Badge>
            )}
            {hasActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(education)}>
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(education)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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
