"use client";

import { useCallback } from "react";
import { BsChevronDown } from "react-icons/bs";

import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useFiltersStore, JobType } from "@/context/store";

type Checked = DropdownMenuCheckboxItemProps["checked"];

export const JobTypeDropDownButton = () => {
  const jobTypes = useFiltersStore((state) => state.jobTypes);
  const setJobTypes = useFiltersStore((state) => state.setJobTypes);

  const handleJobTypeChange = useCallback(
    (type: JobType, checked: boolean) => {
      if (checked) {
        setJobTypes([...jobTypes, type]);
      } else {
        setJobTypes(jobTypes.filter((t) => t !== type));
      }
    },
    [jobTypes, setJobTypes],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-input bg-secondary data-[state=open]:bg-input rounded-full border-none px-3 py-4 shadow-none focus:bg-transparent focus-visible:ring-0"
        asChild
      >
        <Button
          variant="outline"
          className="hover:text-foreground cursor-pointer hover:bg-transparent"
        >
          Job Type
          <BsChevronDown className="ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuCheckboxItem
          checked={jobTypes.includes("full-time") as Checked}
          onCheckedChange={(checked) =>
            handleJobTypeChange("full-time", checked)
          }
        >
          Full-time
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={jobTypes.includes("part-time") as Checked}
          onCheckedChange={(checked) =>
            handleJobTypeChange("part-time", checked)
          }
        >
          Part-time
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={jobTypes.includes("contract") as Checked}
          onCheckedChange={(checked) =>
            handleJobTypeChange("contract", checked)
          }
        >
          Contract
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={jobTypes.includes("internship") as Checked}
          onCheckedChange={(checked) =>
            handleJobTypeChange("internship", checked)
          }
        >
          Internship
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
