"use client";

import { DatePosted, useFiltersStore } from "@/context/store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RemoteOnlyFilter } from "@/app/(main)/components/RemoteOnlyFilter";

export const FilterOptionsContent = () => {
  const datePosted = useFiltersStore((state) => state.datePosted);
  const jobTypes = useFiltersStore((state) => state.jobTypes);
  const serviceRoles = useFiltersStore((state) => state.serviceRoles);

  const setDatePosted = useFiltersStore((state) => state.setDatePosted);
  const setJobTypes = useFiltersStore((state) => state.setJobTypes);
  const setServiceRoles = useFiltersStore((state) => state.setServiceRoles);

  return (
    <div className="w-full space-y-1">
      <RemoteOnlyFilter />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="date-posted" className="border-secondary">
          <AccordionTrigger className="py-3 text-sm font-semibold">
            Date Posted
          </AccordionTrigger>
          <AccordionContent className="flex flex-col space-y-3 pb-3">
            <RadioGroup
              value={datePosted || ""}
              onValueChange={(value) =>
                setDatePosted(value === "" ? null : (value as DatePosted))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  className="border-primary focus-visible:ring-primary"
                  circleClassName="fill-primary"
                  value=""
                  id="any-time"
                />
                <Label
                  htmlFor="any-time"
                  className="border-primary cursor-pointer font-normal"
                >
                  Any Time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  className="border-primary focus-visible:ring-primary"
                  circleClassName="fill-primary"
                  value="last-24-hours"
                  id="last-24-hours"
                />
                <Label
                  htmlFor="last-24-hours"
                  className="cursor-pointer font-normal"
                >
                  Last 24 hours
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  className="border-primary focus-visible:ring-primary"
                  circleClassName="fill-primary"
                  value="last-7-days"
                  id="last-7-days"
                />
                <Label
                  htmlFor="last-7-days"
                  className="cursor-pointer font-normal"
                >
                  Last 7 days
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  className="border-primary focus-visible:ring-primary"
                  circleClassName="fill-primary"
                  value="last-14-days"
                  id="last-14-days"
                />
                <Label
                  htmlFor="last-14-days"
                  className="cursor-pointer font-normal"
                >
                  Last 14 days
                </Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="job-type" className="border-secondary">
          <AccordionTrigger className="py-3 text-sm font-semibold">
            Job Type
          </AccordionTrigger>
          <AccordionContent className="flex flex-col space-y-3 pb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="full-time"
                className="accent-primary focus:ring-primary border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                checked={jobTypes.includes("full-time")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setJobTypes([...jobTypes, "full-time"]);
                  } else {
                    setJobTypes(
                      jobTypes.filter((type) => type !== "full-time"),
                    );
                  }
                }}
              />
              <Label htmlFor="full-time" className="cursor-pointer font-normal">
                Full-time
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="part-time"
                className="accent-primary focus:ring-primary border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                checked={jobTypes.includes("part-time")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setJobTypes([...jobTypes, "part-time"]);
                  } else {
                    setJobTypes(
                      jobTypes.filter((type) => type !== "part-time"),
                    );
                  }
                }}
              />
              <Label htmlFor="part-time" className="cursor-pointer font-normal">
                Part-time
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contract"
                className="accent-primary focus:ring-primary border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                checked={jobTypes.includes("contract")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setJobTypes([...jobTypes, "contract"]);
                  } else {
                    setJobTypes(jobTypes.filter((type) => type !== "contract"));
                  }
                }}
              />
              <Label htmlFor="contract" className="cursor-pointer font-normal">
                Contract
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="internship"
                className="accent-primary focus:ring-primary border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                checked={jobTypes.includes("internship")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setJobTypes([...jobTypes, "internship"]);
                  } else {
                    setJobTypes(
                      jobTypes.filter((type) => type !== "internship"),
                    );
                  }
                }}
              />
              <Label
                htmlFor="internship"
                className="cursor-pointer font-normal"
              >
                Internship
              </Label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="service-role" className="border-secondary">
          <AccordionTrigger className="py-3 text-sm font-semibold">
            Service Role
          </AccordionTrigger>
          <AccordionContent className="flex flex-col space-y-3 pb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="paid"
                className="accent-primary focus:ring-primary border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                checked={serviceRoles.includes("paid")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setServiceRoles([...serviceRoles, "paid"]);
                  } else {
                    setServiceRoles(
                      serviceRoles.filter((role) => role !== "paid"),
                    );
                  }
                }}
              />
              <Label htmlFor="paid" className="cursor-pointer font-normal">
                Paid
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="missionary"
                className="accent-primary focus:ring-primary border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                checked={serviceRoles.includes("missionary")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setServiceRoles([...serviceRoles, "missionary"]);
                  } else {
                    setServiceRoles(
                      serviceRoles.filter((role) => role !== "missionary"),
                    );
                  }
                }}
              />
              <Label
                htmlFor="missionary"
                className="cursor-pointer font-normal"
              >
                Missionary
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="volunteer"
                className="accent-primary focus:ring-primary border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                checked={serviceRoles.includes("volunteer")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setServiceRoles([...serviceRoles, "volunteer"]);
                  } else {
                    setServiceRoles(
                      serviceRoles.filter((role) => role !== "volunteer"),
                    );
                  }
                }}
              />
              <Label htmlFor="volunteer" className="cursor-pointer font-normal">
                Volunteer
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stipend"
                className="accent-primary focus:ring-primary border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                checked={serviceRoles.includes("stipend")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setServiceRoles([...serviceRoles, "stipend"]);
                  } else {
                    setServiceRoles(
                      serviceRoles.filter((role) => role !== "stipend"),
                    );
                  }
                }}
              />
              <Label htmlFor="stipend" className="cursor-pointer font-normal">
                Stipend
              </Label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
