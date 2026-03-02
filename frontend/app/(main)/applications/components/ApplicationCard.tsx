"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImOffice } from "react-icons/im";
import { MdCancelScheduleSend } from "react-icons/md";

import { MoreVertical } from "lucide-react";
import { formatToRelativeDate } from "@/lib/utils";
import { withdrawJobApplication } from "@/lib/api";

interface ApplicationCardProps {
  application: {
    applicationId: number;
    jobId: number;
    employerId: number;
    companyName: string;
    jobTitle: string;
    location: string;
    jobType: string;
    isRemote: boolean;
    status: string;
    appliedAt: Date;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "hired":
      return "bg-green-100 hover:bg-green-100 text-green-700 border-0";
    case "interviewing":
    case "shortlisted":
      return "bg-blue-100 hover:bg-blue-100 text-blue-700 border-0";
    case "pending":
    case "reviewed":
      return "bg-amber-100 hover:bg-amber-100 text-amber-700 border-0";
    case "rejected":
      return "bg-red-100 hover:g-red-100 text-red-700 border-0";
    case "withdrawn":
      return "bg-gray-100 hover:bg-gray-100 text-gray-700 border-0";
    default:
      return "bg-gray-100 hover:bg-gray-100 text-gray-700 border-0";
  }
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const ApplicationCard = ({ application }: ApplicationCardProps) => {
  return (
    <Card className="group overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center justify-start">
            <div className="flex size-8 flex-shrink-0 justify-center rounded-full">
              <ImOffice className="text-muted-foreground mr-2 size-5" />
            </div>
            <span className="text-secondary-foreground line-clamp-1 text-sm text-ellipsis">
              {application.companyName}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-secondary-foreground hover:text-foreground cursor-pointer hover:bg-transparent"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Button
                  variant="ghost"
                  onClick={async () =>
                    await withdrawJobApplication(application.applicationId)
                  }
                >
                  <MdCancelScheduleSend className="mr-1 size-4" />
                  Withdraw Application
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <h3 className="text-foreground mb-2 text-lg leading-tight font-semibold">
          {application.jobTitle}
        </h3>

        {/* Location */}
        <p className="text-secondary-foreground mb-3 text-sm font-medium">
          {application.location}
        </p>

        {/* Job Type & Remote Badge */}
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {application.jobType}
          </Badge>
          {application.isRemote && (
            <Badge variant="outline" className="text-xs">
              Remote
            </Badge>
          )}
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <Badge className={getStatusColor(application.status)}>
            {formatStatus(application.status)}
          </Badge>
        </div>

        {/* Applied Date */}
        <div className="flex items-center gap-2">
          <span className="text-secondary-foreground text-xs font-medium">
            Applied {formatToRelativeDate(application.appliedAt)}
          </span>
        </div>
      </div>
    </Card>
  );
};
