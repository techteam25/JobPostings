"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
  Education,
  WorkExperience,
  Certification,
  UserSkill,
} from "@/lib/types";
import { EducationCard } from "./EducationCard";
import { WorkExperienceCard } from "./WorkExperienceCard";
import { CertificationCard } from "./CertificationCard";
import { SkillBadges } from "./SkillBadges";
import { QualificationEmptyState } from "./QualificationEmptyState";

const TAB_VALUES = [
  "work-experience",
  "education",
  "certifications",
  "skills",
] as const;
type TabValue = (typeof TAB_VALUES)[number];

const DEFAULT_TAB: TabValue = "work-experience";

interface QualificationsContentProps {
  education: Education[];
  workExperiences: WorkExperience[];
  certifications: { certification: Certification }[];
  skills: UserSkill[];
}

export function QualificationsContent({
  education,
  workExperiences,
  certifications,
  skills,
}: QualificationsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab");
  const activeTab: TabValue =
    tabParam && TAB_VALUES.includes(tabParam as TabValue)
      ? (tabParam as TabValue)
      : DEFAULT_TAB;

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="mb-6 h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
        <TabsTrigger
          value="work-experience"
          className="data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          Work Experience ({workExperiences.length})
        </TabsTrigger>
        <TabsTrigger
          value="education"
          className="data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          Education ({education.length})
        </TabsTrigger>
        <TabsTrigger
          value="certifications"
          className="data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          Certifications ({certifications.length})
        </TabsTrigger>
        <TabsTrigger
          value="skills"
          className="data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          Skills ({skills.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="work-experience" className="mt-0">
        {workExperiences.length === 0 ? (
          <QualificationEmptyState
            title="No Work Experience Added"
            description="Add your work history to showcase your professional experience to employers."
            ctaLabel="Add Work Experience"
          />
        ) : (
          <div className="space-y-3">
            {workExperiences.map((exp) => (
              <WorkExperienceCard key={exp.id} experience={exp} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="education" className="mt-0">
        {education.length === 0 ? (
          <QualificationEmptyState
            title="No Education Added"
            description="Add your educational background to strengthen your profile."
            ctaLabel="Add Education"
          />
        ) : (
          <div className="space-y-3">
            {education.map((edu) => (
              <EducationCard key={edu.id} education={edu} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="certifications" className="mt-0">
        {certifications.length === 0 ? (
          <QualificationEmptyState
            title="No Certifications Added"
            description="Add professional certifications to demonstrate your expertise."
            ctaLabel="Add Certification"
          />
        ) : (
          <div className="space-y-3">
            {certifications.map((c) => (
              <CertificationCard
                key={c.certification.id}
                certification={c.certification}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="skills" className="mt-0">
        {skills.length === 0 ? (
          <QualificationEmptyState
            title="No Skills Added"
            description="Add skills to help employers find you for relevant opportunities."
            ctaLabel="Add Skill"
          />
        ) : (
          <SkillBadges skills={skills} />
        )}
      </TabsContent>
    </Tabs>
  );
}
