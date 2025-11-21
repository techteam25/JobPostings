import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { X } from "lucide-react";
import { BsChevronDown } from "react-icons/bs";
import { cn } from "@/lib/utils";
import { CheckmarkOption } from "@/components/common/CheckMarkOption";

interface Props {
  defaultSort: string;
  onSortChange: (sort: string) => void;
}
export const SortByMobileButton = ({ defaultSort, onSortChange }: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger className="lg:hidden" asChild>
        <Button
          variant="outline"
          className="flex items-center border-0 shadow-none"
        >
          {defaultSort}
          <BsChevronDown
            className={cn(
              "ml-1 rotate-0 transition-transform",
              open && "rotate-180",
            )}
          />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-1/2 px-4">
        <DrawerHeader className="p-0 px-4 text-left">
          <DrawerTitle className="text-base font-medium">
            <div className="flex items-center justify-between">
              <span>Sort By</span>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                <X />
              </Button>
            </div>
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Change job results sorting options
          </DrawerDescription>
        </DrawerHeader>
        <CheckmarkOption
          label="Most Recent"
          checked={defaultSort === "Most Recent"}
          onCheckedChange={onSortChange}
        />
        <CheckmarkOption
          label="Most Relevant"
          checked={defaultSort === "Most Relevant"}
          onCheckedChange={onSortChange}
        />
      </DrawerContent>
    </Drawer>
  );
};
