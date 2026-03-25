import { Badge } from "@/components/ui/badge";
import type { UserSkill } from "@/lib/types";

interface SkillBadgesProps {
  skills: UserSkill[];
}

export function SkillBadges({ skills }: SkillBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((userSkill) => (
        <Badge
          key={userSkill.id}
          variant="secondary"
          data-slot="badge"
          className="px-3 py-1.5 text-sm"
        >
          {userSkill.skill.name}
        </Badge>
      ))}
    </div>
  );
}
