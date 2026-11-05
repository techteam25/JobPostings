"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { MoreVertical, Download, Trash2, ArrowLeftRight } from "lucide-react";
import { useDeleteResume } from "@/app/(main)/me/profile/edit/hooks/use-delete-resume";

interface ResumeContextMenuProps {
  resumeUrl: string | null;
}

const ResumeContextMenu = ({ resumeUrl }: ResumeContextMenuProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { mutateAsync: deleteResume, isPending: isDeleting } =
    useDeleteResume();
  const router = useRouter();

  const hasResume = !!resumeUrl;

  const handleDownload = () => {
    if (resumeUrl) {
      window.open(resumeUrl, "_blank");
    }
  };

  const handleReplace = () => {
    router.push("/me/profile/edit");
  };

  const handleDelete = async () => {
    await deleteResume();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary hover:text-secondary-foreground p-2"
            disabled={!hasResume}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" side="bottom">
          <DropdownMenuGroup className="flex flex-col space-y-2">
            <DropdownMenuItem
              className="hover:bg-secondary cursor-pointer rounded-lg p-2"
              disabled={!hasResume}
              onSelect={handleDownload}
            >
              <div className="grid grid-cols-[auto_1fr] items-center gap-2 font-medium">
                <Download className="text-secondary-foreground mr-2 size-5" />
                <span>Download</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-secondary cursor-pointer rounded-lg p-2"
              onSelect={handleReplace}
            >
              <div className="grid grid-cols-[auto_1fr] items-center gap-2 font-medium">
                <ArrowLeftRight className="text-secondary-foreground mr-2 size-5" />
                <span>Replace file</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-secondary cursor-pointer rounded-lg p-2"
              disabled={!hasResume || isDeleting}
              onSelect={() => setShowDeleteConfirm(true)}
            >
              <div className="grid grid-cols-[auto_1fr] items-center gap-2 font-medium">
                <Trash2 className="text-destructive mr-2 size-5" />
                <span className="text-destructive">Delete</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resume?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your resume. You can upload a new one
              at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ResumeContextMenu;
