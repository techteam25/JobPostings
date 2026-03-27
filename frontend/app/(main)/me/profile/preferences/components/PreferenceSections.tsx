"use client";

import { ReactNode, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { JobPreference } from "@/schemas/job-preferences";
import {
  JOB_TYPE_LABELS,
  COMPENSATION_TYPE_LABELS,
  VOLUNTEER_HOURS_LABELS,
  WORK_SCHEDULE_DAY_LABELS,
  SCHEDULE_TYPE_LABELS,
} from "@/schemas/job-preferences";
import { JobTypesDialog } from "./JobTypesDialog";
import { CompensationTypesDialog } from "./CompensationTypesDialog";
import { WorkScheduleDialog } from "./WorkScheduleDialog";

interface PreferenceSectionsProps {
  preferences: JobPreference | null;
}

function SectionRow({
  label,
  children,
  onEdit,
}: {
  label: string;
  children: ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <Pencil />
          <span className="sr-only">Edit {label}</span>
        </Button>
      )}
    </div>
  );
}

function NotSet() {
  return <span className="text-muted-foreground text-sm">Not set</span>;
}

export function PreferenceSections({ preferences }: PreferenceSectionsProps) {
  const [jobTypesDialogOpen, setJobTypesDialogOpen] = useState(false);
  const [compTypesDialogOpen, setCompTypesDialogOpen] = useState(false);
  const [workScheduleDialogOpen, setWorkScheduleDialogOpen] = useState(false);

  const jobTypes = preferences?.jobTypes ?? [];
  const compensationTypes = preferences?.compensationTypes ?? [];
  const volunteerHours = preferences?.volunteerHoursPerWeek ?? null;
  const workScheduleDays = preferences?.workScheduleDays ?? [];
  const scheduleTypes = preferences?.scheduleTypes ?? [];

  return (
    <div className="divide-border divide-y rounded-lg border p-2 sm:p-4">
      {/* Job Types */}
      <SectionRow label="Job Types" onEdit={() => setJobTypesDialogOpen(true)}>
        {jobTypes.length > 0 ? (
          jobTypes.map((type) => (
            <Badge key={type} variant="secondary">
              {JOB_TYPE_LABELS[type] ?? type}
            </Badge>
          ))
        ) : (
          <NotSet />
        )}
      </SectionRow>

      {/* Volunteer Hours (only shown when volunteer is selected) */}
      {jobTypes.includes("volunteer") && (
        <>
          <SectionRow label="Volunteer Hours / Week">
            {volunteerHours ? (
              <Badge variant="secondary">
                {VOLUNTEER_HOURS_LABELS[volunteerHours] ?? volunteerHours}
              </Badge>
            ) : (
              <NotSet />
            )}
          </SectionRow>
        </>
      )}

      <Separator className="my-0" />

      {/* Compensation Types */}
      <SectionRow
        label="Compensation Types"
        onEdit={() => setCompTypesDialogOpen(true)}
      >
        {compensationTypes.length > 0 ? (
          compensationTypes.map((type) => (
            <Badge key={type} variant="secondary">
              {COMPENSATION_TYPE_LABELS[type] ?? type}
            </Badge>
          ))
        ) : (
          <NotSet />
        )}
      </SectionRow>

      <Separator className="my-0" />

      {/* Work Schedule */}
      <SectionRow
        label="Work Schedule"
        onEdit={() => setWorkScheduleDialogOpen(true)}
      >
        {workScheduleDays.length > 0 || scheduleTypes.length > 0 ? (
          <>
            {workScheduleDays.map((day) => (
              <Badge key={day} variant="secondary">
                {WORK_SCHEDULE_DAY_LABELS[day] ?? day}
              </Badge>
            ))}
            {scheduleTypes.map((type) => (
              <Badge key={type} variant="secondary">
                {SCHEDULE_TYPE_LABELS[type] ?? type}
              </Badge>
            ))}
          </>
        ) : (
          <NotSet />
        )}
      </SectionRow>

      {/* Future sections — placeholders */}
      <SectionRow label="Location Preferences">
        <NotSet />
      </SectionRow>

      <SectionRow label="Salary Expectations">
        <NotSet />
      </SectionRow>

      <SectionRow label="Remote Work">
        <NotSet />
      </SectionRow>

      <SectionRow label="Start Date Availability">
        <NotSet />
      </SectionRow>

      <SectionRow label="Industry Preferences">
        <NotSet />
      </SectionRow>

      {/* Dialogs */}
      <JobTypesDialog
        open={jobTypesDialogOpen}
        onOpenChange={setJobTypesDialogOpen}
        defaultJobTypes={jobTypes}
        defaultVolunteerHours={volunteerHours}
      />

      <CompensationTypesDialog
        open={compTypesDialogOpen}
        onOpenChange={setCompTypesDialogOpen}
        defaultCompensationTypes={compensationTypes}
      />

      <WorkScheduleDialog
        open={workScheduleDialogOpen}
        onOpenChange={setWorkScheduleDialogOpen}
        defaultWorkScheduleDays={workScheduleDays}
        defaultScheduleTypes={scheduleTypes}
      />
    </div>
  );
}
