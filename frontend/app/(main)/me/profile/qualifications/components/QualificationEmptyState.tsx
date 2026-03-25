import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

interface QualificationEmptyStateProps {
  title: string;
  description: string;
  ctaLabel: string;
}

export function QualificationEmptyState({
  title,
  description,
  ctaLabel,
}: QualificationEmptyStateProps) {
  return (
    <Empty className="py-12">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button disabled variant="outline" size="sm">
          <Plus className="mr-1.5 size-4" />
          {ctaLabel}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
