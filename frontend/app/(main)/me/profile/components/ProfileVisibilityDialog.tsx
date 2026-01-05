"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

import { ChevronRight, Eye } from "lucide-react";
import { updateProfileVisibility } from "@/lib/api";

const ProfileVisibilityDialog = ({ isVisible }: { isVisible: boolean }) => {
  const defaultValue = isVisible ? "profile-visible" : "profile-invisible";

  const handleUpdateVisibility = async (value: string) => {
    const isVisible = value === "profile-visible";
    await updateProfileVisibility(isVisible);
  };

  return (
    <Dialog>
      <DialogTrigger asChild className="w-full">
        <Button className="flex cursor-pointer items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 shadow-none hover:bg-green-50">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-green-600" />
            <span className="text-foreground text-sm font-medium">
              Employers can find you
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-green-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col space-y-3 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Choose your profile visibility settings
          </DialogDescription>
          <Separator className="bg-muted-foreground/50 my-2" />
        </DialogHeader>
        <RadioGroup
          defaultValue={defaultValue}
          className="flex flex-col gap-6"
          onValueChange={handleUpdateVisibility}
        >
          <div className="border-border rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Label
                htmlFor="profile-invisible"
                className="text-foreground text-base font-semibold"
              >
                Organizations cannot find your profile
              </Label>
              <RadioGroupItem
                value="profile-invisible"
                id="profile-invisible"
                className="border-secondary-foreground size-5 focus-visible:ring-0 focus-visible:ring-transparent"
                circleClassName="size-4 fill-secondary-foreground"
              />
            </div>
            <p className="text-muted-foreground text-sm">
              Your profile will be visible to recruiters and organizations you
              apply to. They will be able to see your name, contact information,
              work experience, education, and skills.
            </p>
          </div>
          <div className="border-border rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Label
                htmlFor="profile-visible"
                className="text-foreground text-base font-semibold"
              >
                Organizations can find you
              </Label>
              <RadioGroupItem
                value="profile-visible"
                id="profile-visible"
                className="border-secondary-foreground size-5 focus-visible:ring-0 focus-visible:ring-transparent"
                circleClassName="size-4 fill-secondary-foreground"
              />
            </div>
            <p className="text-muted-foreground text-sm">
              Your profile will be visible to all users on the platform. This
              includes recruiters, organizations, and other job seekers. They
              will be able to see your name, contact information, work
              experience, education, and skills.
            </p>
          </div>
        </RadioGroup>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" className="cursor-pointer">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileVisibilityDialog;
