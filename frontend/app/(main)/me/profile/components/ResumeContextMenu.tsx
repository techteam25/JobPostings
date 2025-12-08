"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MoreVertical } from "lucide-react";
import { BsDownload, BsTrash3Fill } from "react-icons/bs";
import { TbReplace } from "react-icons/tb";

const ResumeContextMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-secondary hover:text-secondary-foreground p-2"
        >
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" side="bottom">
        <DropdownMenuGroup className="flex flex-col space-y-2">
          <DropdownMenuItem className="hover:bg-secondary cursor-pointer rounded-lg p-2">
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 font-medium">
              <BsDownload className="text-secondary-foreground mr-2 size-5" />
              <span>Download</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-secondary cursor-pointer rounded-lg p-2">
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 font-medium">
              <TbReplace className="text-secondary-foreground mr-2 size-5" />
              <span>Replace file</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-secondary cursor-pointer rounded-lg p-2">
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 font-medium">
              <BsTrash3Fill className="text-destructive mr-2 size-5" />
              <span className="text-destructive">Delete</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ResumeContextMenu;
