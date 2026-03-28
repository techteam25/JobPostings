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
import { ChevronDown, X } from "lucide-react";
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
          <ChevronDown
            className={cn(
              "ml-1 rotate-0 transition-transform",
              open && "rotate-180",
            )}
          />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-1">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base font-medium">Sort By</DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-8 rounded-full"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <DrawerDescription className="sr-only">
            Change job results sorting options
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">
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
        </div>
      </DrawerContent>
    </Drawer>
  );
};
