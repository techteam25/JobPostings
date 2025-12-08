import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Mail,
  Phone,
  ChevronRight,
  MoreVertical,
  Briefcase,
  DollarSign,
  Watch,
  X,
  ArrowRight,
} from "lucide-react";
import { FaFilePdf } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";

import { getUserInformation } from "@/lib/api";
import ProfileVisibilityDialog from "@/app/(main)/me/profile/components/ProfileVisibilityDialog";
import Link from "next/link";
import ResumeContextMenu from "@/app/(main)/me/profile/components/ResumeContextMenu";

export default async function ProfilePage() {
  const profile = await getUserInformation();

  if (!profile || !profile.success) {
    return <ProfileSkeleton />;
  }

  const avatarInitials = profile.data.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="bg-background min-h-screen">
      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Compact Profile Header - Indeed style with ZipRecruiter details */}
        <div className="bg-background mb-6 rounded-lg border p-8">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.data.image} />
                <AvatarFallback className="bg-secondary text-primary-foreground text-xl">
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-foreground mb-3 text-3xl font-bold">
                  {profile.data.fullName}
                </h1>
                <div className="text-secondary-foreground space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="size-5" />
                    <span>{profile.data.email}</span>
                    {/*  Todo: Add Email Verified banner if not verified */}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-5" />
                    <span>{profile.data.profile.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-5" />
                    <span>
                      {profile.data.profile.city},{" "}
                      <span>
                        {profile.data.profile.state},{" "}
                        <span>{profile.data.profile.country}</span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-secondary hover:text-secondary-foreground"
              asChild
            >
              <Link href="/me/profile/edit">
                <ChevronRight />
              </Link>
            </Button>
          </div>

          {/* Visibility Status */}
          <ProfileVisibilityDialog
            isVisible={profile.data.profile.isProfilePublic}
          />
        </div>

        {/* Resume Section - Hybrid approach */}
        <div className="mb-6">
          <h2 className="text-foreground mb-3 text-xl font-bold">Resume</h2>
          <Card className="shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 flex-shrink-0 items-center justify-center rounded">
                    <FaFilePdf className="text-secondary-foreground size-8" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      {`Resume - ${profile.data.fullName}.pdf`}
                    </p>
                    <p className="text-xs text-gray-500">Added Nov 2, 2025</p>
                  </div>
                </div>
                <ResumeContextMenu />
              </div>
            </CardContent>
          </Card>

          {/* Resume CTA */}
          <Card className="border-primary/20 mt-3 bg-blue-50 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    <FaSearch />
                  </span>
                  <div>
                    <p className="text-foreground text-sm font-semibold">
                      Get a resume that keeps employers calling
                    </p>
                    <a
                      href="#"
                      className="text-primary/80 hover:text-primary inline-flex items-center gap-1 text-sm font-medium"
                    >
                      Improve your resume <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <X />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Improve Your Job Matches - Indeed style with better visual hierarchy */}
        <div className="mb-6">
          <h2 className="text-foreground mb-3 text-xl font-bold">
            Improve your job matches
          </h2>
          <div className="space-y-3">
            <Card className="cursor-pointer shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100">
                      <Briefcase className="size-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-foreground mb-1 font-semibold">
                        Qualifications
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Highlight your skills and experience.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-secondary hover:text-secondary-foreground"
                    asChild
                  >
                    <Link href="/me/profile/qualifications">
                      <ChevronRight />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                      <DollarSign className="size-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-foreground mb-1 font-semibold">
                        Job preferences
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Save specific details like minimum desired pay and
                        schedule.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-secondary hover:text-secondary-foreground"
                    asChild
                  >
                    <Link href="/me/profile/preferences">
                      <ChevronRight />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100">
                      <Watch className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-foreground mb-1 font-semibold">
                        Ready to work
                      </h3>
                      <p className="text-secondary-foreground text-sm">
                        Let employers know you're available to start
                        immediately.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-secondary hover:text-secondary-foreground"
                    asChild
                  >
                    <Link href="/me/profile/readytowork">
                      <ChevronRight />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Profile Strength Indicator - Unique addition */}
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-foreground mb-1 font-bold">
                  Profile Strength: Strong
                </h3>
                <p className="text-secondary-foreground text-sm">
                  Your profile is 95% complete
                </p>
              </div>
              <Badge className="text-primary-foreground bg-green-600">
                95%
              </Badge>
            </div>
            <div className="bg-input mb-3 h-2.5 w-full rounded-full">
              <div
                className="h-2.5 rounded-full bg-green-600"
                style={{ width: "95%" }}
              ></div>
            </div>
            <p className="text-secondary-foreground text-xs">
              Add work history to reach 100% and increase your visibility to
              employers
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header card */}
        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-start gap-6">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="w-full space-y-3">
                <Skeleton className="h-8 w-48" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>

        {/* Resume section */}
        <div>
          <h2 className="mb-3 text-xl font-bold text-gray-900">Resume</h2>
          <div className="space-y-3">
            <div className="rounded-lg border bg-white">
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded bg-blue-100" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Improve your job matches */}
        <div>
          <h2 className="mb-3 text-xl font-bold text-gray-900">
            Improve your job matches
          </h2>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg border bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile strength */}
        <div className="rounded-lg border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="space-y-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-8 w-12 rounded" />
            </div>

            <div className="mb-3 h-2.5 w-full rounded-full bg-gray-200">
              <Skeleton className="h-2.5 w-3/4 rounded-full" />
            </div>

            <Skeleton className="h-3 w-80" />
          </div>
        </div>
      </main>
    </div>
  );
}
