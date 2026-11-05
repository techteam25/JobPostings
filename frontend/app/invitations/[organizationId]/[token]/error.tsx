"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Invitations] Route error:", error);
  }, [error]);

  return (
    <Empty className="min-h-[50vh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangle />
        </EmptyMedia>
        <EmptyTitle>Couldn&apos;t load invitation</EmptyTitle>
        <EmptyDescription>
          We ran into a problem loading this invitation. Please try again or
          contact the person who invited you.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" className="cursor-pointer" onClick={reset}>
          <RefreshCcw className="mr-2 size-4" />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}
