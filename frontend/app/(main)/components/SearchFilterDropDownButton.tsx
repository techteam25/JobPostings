"use client";

import { DatePosted, useFiltersStore } from "@/context/store";
import { BsSliders } from "react-icons/bs";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { RemoteOnlyFilter } from "@/app/(main)/components/RemoteOnlyFilter";

type Checked = DropdownMenuCheckboxItemProps["checked"];
export const SearchFilterDropDownButton = () => {
  const datePosted = useFiltersStore((state) => state.datePosted);
  const jobTypes = useFiltersStore((state) => state.jobTypes);
  const serviceRoles = useFiltersStore((state) => state.serviceRoles);

  const setDatePosted = useFiltersStore((state) => state.setDatePosted);
  const setJobTypes = useFiltersStore((state) => state.setJobTypes);
  const setServiceRoles = useFiltersStore((state) => state.setServiceRoles);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-input bg-secondary data-[state=open]:bg-input rounded-full border-none px-3 py-4 shadow-none focus:bg-transparent focus-visible:ring-0"
        asChild
      >
        <Button variant="outline" size="icon">
          <BsSliders className="mr-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="my-4 w-auto p-4">
        <RemoteOnlyFilter />
        <Accordion type="single" collapsible className="my-2 w-72">
          <AccordionItem value="date-posted" className="border-secondary">
            <AccordionTrigger className="p-1">Date Posted</AccordionTrigger>
            <AccordionContent className="flex flex-col pb-1 text-balance">
              <DropdownMenuRadioGroup
                value={datePosted || ""}
                onValueChange={(value) =>
                  setDatePosted(value === "" ? null : (value as DatePosted))
                }
              >
                <DropdownMenuRadioItem value="">Any Time</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="last-24-hours">
                  Last 24 hours
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="last-7-days">
                  Last 7 days
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="last-14-days">
                  Last 14 days
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Accordion type="single" collapsible className="my-2 w-72">
          <AccordionItem value="date-posted" className="border-secondary">
            <AccordionTrigger className="p-1">Job Type</AccordionTrigger>
            <AccordionContent className="flex flex-col pb-1 text-balance">
              <DropdownMenuCheckboxItem
                checked={jobTypes.includes("full-time") as Checked}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setJobTypes([...jobTypes, "full-time"]);
                  } else {
                    setJobTypes(
                      jobTypes.filter((type) => type !== "full-time"),
                    );
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
                    setJobTypes(
                      jobTypes.filter((type) => type !== "part-time"),
                    );
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
                    setJobTypes(
                      jobTypes.filter((type) => type !== "internship"),
                    );
                  }
                }}
              >
                Internship
              </DropdownMenuCheckboxItem>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Accordion type="single" collapsible className="my-2 w-72">
          <AccordionItem value="date-posted" className="border-secondary">
            <AccordionTrigger className="p-1">Service Role</AccordionTrigger>
            <AccordionContent className="flex flex-col pb-1 text-balance">
              <DropdownMenuCheckboxItem
                checked={serviceRoles.includes("paid") as Checked}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setServiceRoles([...serviceRoles, "paid"]);
                  } else {
                    setServiceRoles(
                      serviceRoles.filter((role) => role !== "paid"),
                    );
                  }
                }}
              >
                Paid
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={serviceRoles.includes("missionary") as Checked}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setServiceRoles([...serviceRoles, "missionary"]);
                  } else {
                    setServiceRoles(
                      serviceRoles.filter((role) => role !== "missionary"),
                    );
                  }
                }}
              >
                Missionary
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={serviceRoles.includes("volunteer") as Checked}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setServiceRoles([...serviceRoles, "volunteer"]);
                  } else {
                    setServiceRoles(
                      serviceRoles.filter((role) => role !== "volunteer"),
                    );
                  }
                }}
              >
                Volunteer
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={serviceRoles.includes("stipend") as Checked}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setServiceRoles([...serviceRoles, "stipend"]);
                  } else {
                    setServiceRoles(
                      serviceRoles.filter((role) => role !== "stipend"),
                    );
                  }
                }}
              >
                Stipend
              </DropdownMenuCheckboxItem>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
