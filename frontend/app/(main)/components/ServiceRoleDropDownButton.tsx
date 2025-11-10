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
import { useFiltersStore } from "../../../context/store";

type Checked = DropdownMenuCheckboxItemProps["checked"];

export const ServiceRoleDropDownButton = () => {
  const serviceRoles = useFiltersStore((state) => state.serviceRoles);
  const setServiceRoles = useFiltersStore((state) => state.setServiceRoles);
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
          Service Role
          <BsChevronDown className="ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuCheckboxItem
          checked={serviceRoles.includes("paid") as Checked}
          onCheckedChange={(checked) => {
            if (checked) {
              setServiceRoles([...serviceRoles, "paid"]);
            } else {
              setServiceRoles(serviceRoles.filter((role) => role !== "paid"));
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
