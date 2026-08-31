"use client";

import { Briefcase, GraduationCap, MapPin, Award } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { formatToReadableDate } from "@/lib/utils";
import type { PublicCandidateProfile } from "@/types/candidate";

interface CandidateProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: PublicCandidateProfile | null;
  isLoading: boolean;
  isError: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function formatDateRange(
  startDate: string,
  endDate: string | null,
  current: boolean,
): string {
  const start = formatToReadableDate(new Date(startDate));
  if (current) return `${start} – Present`;
  if (!endDate) return start;
  return `${start} – ${formatToReadableDate(new Date(endDate))}`;
}

export function CandidateProfileSheet({
  open,
  onOpenChange,
  profile,
  isLoading,
  isError,
}: CandidateProfileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {isLoading ? (
          <CandidateProfileSkeleton />
        ) : isError || !profile ? (
          <div className="flex flex-col gap-2 px-4 py-8">
            <SheetHeader>
              <SheetTitle>Profile unavailable</SheetTitle>
              <SheetDescription>
                This candidate profile is not public or could not be loaded.
              </SheetDescription>
            </SheetHeader>
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-start gap-4">
                <Avatar className="size-14">
                  {profile.photoUrl ? (
                    <AvatarImage src={profile.photoUrl} alt={profile.name} />
                  ) : null}
                  <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-1">
                  <SheetTitle>{profile.name}</SheetTitle>
                  <SheetDescription className="line-clamp-2">
                    {profile.headline || "No headline provided"}
                  </SheetDescription>
                  {profile.location ? (
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <MapPin className="size-3.5" />
                      {profile.location}
                    </span>
                  ) : null}
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {profile.yearsOfExperience} years experience
                </Badge>
                {profile.openToWork ? (
                  <Badge>Open to work</Badge>
                ) : (
                  <Badge variant="outline">Not available</Badge>
                )}
              </div>

              {profile.bio ? (
                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">About</h3>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </section>
              ) : null}

              {profile.skills.length > 0 ? (
                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </section>
              ) : null}

              {profile.workExperiences.length > 0 ? (
                <>
                  <Separator />
                  <section className="flex flex-col gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Briefcase className="size-4" />
                      Work experience
                    </h3>
                    <ul className="flex flex-col gap-3">
                      {profile.workExperiences.map((experience) => (
                        <li
                          key={`${experience.companyName}-${experience.jobTitle}-${experience.startDate}`}
                          className="flex flex-col gap-1"
                        >
                          <span className="text-sm font-medium">
                            {experience.jobTitle}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {experience.companyName}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {formatDateRange(
                              experience.startDate,
                              experience.endDate,
                              experience.current,
                            )}
                          </span>
                          {experience.description ? (
                            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                              {experience.description}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              ) : null}

              {profile.educations.length > 0 ? (
                <>
                  <Separator />
                  <section className="flex flex-col gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <GraduationCap className="size-4" />
                      Education
                    </h3>
                    <ul className="flex flex-col gap-3">
                      {profile.educations.map((education) => (
                        <li
                          key={`${education.schoolName}-${education.major}-${education.startDate}`}
                          className="flex flex-col gap-1"
                        >
                          <span className="text-sm font-medium">
                            {education.schoolName}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {education.major}
                            {education.graduated ? " · Graduated" : ""}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {formatDateRange(
                              education.startDate,
                              education.endDate,
                              false,
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              ) : null}

              {profile.certifications.length > 0 ? (
                <>
                  <Separator />
                  <section className="flex flex-col gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Award className="size-4" />
                      Certifications
                    </h3>
                    <ul className="flex flex-col gap-1">
                      {profile.certifications.map((certification) => (
                        <li key={certification} className="text-sm">
                          {certification}
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              ) : null}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CandidateProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-2">
      <div className="flex items-start gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
