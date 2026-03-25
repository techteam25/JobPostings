import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserSkill } from "@/lib/types";

interface SkillBadgesProps {
  skills: UserSkill[];
  onRemove?: (skill: UserSkill) => void;
}

export function SkillBadges({ skills, onRemove }: SkillBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((userSkill) => (
        <Badge
          key={userSkill.id}
          variant="secondary"
          data-slot="badge"
          className={cn(
            "py-1.5 text-sm",
            onRemove ? "gap-1.5 pr-1.5 pl-3" : "px-3",
          )}
        >
          {userSkill.skill.name}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(userSkill)}
              className="text-muted-foreground hover:text-foreground rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${userSkill.skill.name}`}
            >
              <X className="size-3.5" />
            </button>
          )}
        </Badge>
      ))}
    </div>
  );
}
