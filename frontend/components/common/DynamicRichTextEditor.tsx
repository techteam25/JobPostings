"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const DynamicRichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="size-8 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-50 w-full rounded-md" />
    </div>
  ),
});

export { DynamicRichTextEditor };
