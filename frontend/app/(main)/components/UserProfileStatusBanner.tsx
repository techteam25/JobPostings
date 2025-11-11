"use client";

import {
  CheckCircle2Icon,
  CircleXIcon,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";

import { useGetUserProfileStatus } from "@/app/(main)/hooks/use-get-user-profile-status";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const UserProfileStatusBanner = () => {
  const { status, isFetchingStatus, fetchProfileError } =
    useGetUserProfileStatus();

  if (isFetchingStatus) {
    return (
      <div className="border-primary bg-primary/10 grid w-full max-w-xl items-center gap-3 rounded-xl border p-2">
        <Alert className="text-primary flex items-center gap-2 border-0 bg-transparent">
          <LoaderCircle className="animate-spin" />
          <AlertTitle>Checking Profile status</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (fetchProfileError || !status) {
    return (
      <div className="border-destructive bg-destructive/10 grid w-full max-w-xl items-center gap-3 rounded-xl border p-2">
        <Alert className="flex items-center gap-2 border-0 bg-transparent">
          <CircleXIcon className="text-destructive" />
          <AlertTitle>
            Failed to fetch current status of your profile
          </AlertTitle>
        </Alert>
      </div>
    );
  }

  return status.complete ? null : (
    <div className="grid w-full max-w-xl items-center gap-3 rounded-xl border border-[#92400e] bg-[#fffbeb] p-2">
      <Alert className="flex items-center gap-2 border-0 bg-transparent text-[#92400e]">
        <TriangleAlert />
        <AlertDescription className="text-[#92400e]">
          Complete your profile to continue applying for jobs.
        </AlertDescription>
        <Button size="sm" className="bg-foreground rounded-md">
          Complete Profile
        </Button>
      </Alert>
    </div>
  );
};
