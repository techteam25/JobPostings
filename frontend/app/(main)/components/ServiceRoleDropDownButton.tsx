"use client";

import { memo, useCallback } from "react";
import { ChevronDown } from "lucide-react";

import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useFiltersStore } from "@/context/store";

type Checked = DropdownMenuCheckboxItemProps["checked"];

export const ServiceRoleDropDownButton = memo(
  function ServiceRoleDropDownButton() {
    const serviceRoles = useFiltersStore((state) => state.serviceRoles);
    const setServiceRoles = useFiltersStore((state) => state.setServiceRoles);

    const handleServiceRoleChange = useCallback(
      (role: (typeof serviceRoles)[number], checked: boolean) => {
        if (checked) {
          setServiceRoles([...serviceRoles, role]);
        } else {
          setServiceRoles(serviceRoles.filter((r) => r !== role));
        }
      },
      [serviceRoles, setServiceRoles],
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
            Service Role
            <ChevronDown className="ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" side="bottom">
          <DropdownMenuGroup className="flex flex-col space-y-2">
            <DropdownMenuCheckboxItem
              checked={serviceRoles.includes("paid") as Checked}
              onCheckedChange={(checked) =>
                handleServiceRoleChange("paid", checked)
              }
              className="hover:bg-secondary cursor-pointer rounded-lg py-2 pr-2 pl-8 font-medium"
            >
              Paid
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={serviceRoles.includes("missionary") as Checked}
              onCheckedChange={(checked) =>
                handleServiceRoleChange("missionary", checked)
              }
              className="hover:bg-secondary cursor-pointer rounded-lg py-2 pr-2 pl-8 font-medium"
            >
              Missionary
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={serviceRoles.includes("volunteer") as Checked}
              onCheckedChange={(checked) =>
                handleServiceRoleChange("volunteer", checked)
              }
              className="hover:bg-secondary cursor-pointer rounded-lg py-2 pr-2 pl-8 font-medium"
            >
              Volunteer
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={serviceRoles.includes("stipend") as Checked}
              onCheckedChange={(checked) =>
                handleServiceRoleChange("stipend", checked)
              }
              className="hover:bg-secondary cursor-pointer rounded-lg py-2 pr-2 pl-8 font-medium"
            >
              Stipend
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);
ServiceRoleDropDownButton.displayName = "ServiceRoleDropDownButton";
