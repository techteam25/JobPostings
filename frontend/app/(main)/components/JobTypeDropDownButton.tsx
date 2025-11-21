"use client";

import { BsChevronDown } from "react-icons/bs";

import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useFiltersStore } from "@/context/store";

type Checked = DropdownMenuCheckboxItemProps["checked"];

export const JobTypeDropDownButton = () => {
  const jobTypes = useFiltersStore((state) => state.jobTypes);
  const setJobTypes = useFiltersStore((state) => state.setJobTypes);
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
          onCheckedChange={(checked) => {
            if (checked) {
              setJobTypes([...jobTypes, "full-time"]);
            } else {
              setJobTypes(jobTypes.filter((type) => type !== "full-time"));
            }
          }}
        >
          Full-time
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={jobTypes.includes("part-time") as Checked}
          onCheckedChange={(checked) => {
            if (checked) {
              setJobTypes([...jobTypes, "part-time"]);
            } else {
              setJobTypes(jobTypes.filter((type) => type !== "part-time"));
            }
          }}
        >
          Part-time
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={jobTypes.includes("contract") as Checked}
          onCheckedChange={(checked) => {
            if (checked) {
              setJobTypes([...jobTypes, "contract"]);
            } else {
              setJobTypes(jobTypes.filter((type) => type !== "contract"));
            }
          }}
        >
          Contract
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={jobTypes.includes("internship") as Checked}
          onCheckedChange={(checked) => {
            if (checked) {
              setJobTypes([...jobTypes, "internship"]);
            } else {
              setJobTypes(jobTypes.filter((type) => type !== "internship"));
            }
          }}
        >
          Internship
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
