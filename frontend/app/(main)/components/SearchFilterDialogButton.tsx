"use client";

import { BsSliders } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilterOptionsContent } from "@/app/(main)/components/FilterOptionsContent";

export function SearchFilterDialogButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="hover:bg-input bg-secondary rounded-full border-none px-3 py-4 shadow-none"
        >
          <BsSliders className="mr-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-h-[85vh] w-4/5 overflow-y-auto rounded-2xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Jobs</DialogTitle>
          <DialogDescription>
            Refine your job search using the filters below
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <FilterOptionsContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
