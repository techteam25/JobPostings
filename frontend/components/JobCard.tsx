"use client";

import { JobCardType } from "@/lib/types";
import { ArrowRight, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

export const JobCard = ({
  positionName,
  posted,
  companyName,
  jobType,
  jobDescription,
  location,
  experienceLevel,
  onApply,
}: JobCardType) => {
  return (
    <div className="rounded-lg border border-gray-200 p-6 transition hover:border-orange-500">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-600 text-2xl font-bold text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path
                fill="white"
                d="M576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 440 146.7 540.8 258.2 568.5L258.2 398.2L205.4 398.2L205.4 320L258.2 320L258.2 286.3C258.2 199.2 297.6 158.8 383.2 158.8C399.4 158.8 427.4 162 438.9 165.2L438.9 236C432.9 235.4 422.4 235 409.3 235C367.3 235 351.1 250.9 351.1 292.2L351.1 320L434.7 320L420.3 398.2L351 398.2L351 574.1C477.8 558.8 576 450.9 576 320z"
              />
            </svg>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-lg font-bold">{positionName}</h3>
              <span className="text-sm text-gray-500">{posted}</span>
            </div>
            <p className="text-gray-600">
              {companyName} · {location}
            </p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <Bookmark className="h-6 w-6" />
        </button>
      </div>

      <p className="mb-4 line-clamp-3 text-gray-700">{jobDescription}</p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-sm text-gray-700">
            🕐 {jobType}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-sm text-yellow-700">
            🏆 {experienceLevel}
          </span>
        </div>
        <Button
          onClick={onApply}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-2 font-semibold text-white transition hover:bg-orange-600"
        >
          Apply <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
