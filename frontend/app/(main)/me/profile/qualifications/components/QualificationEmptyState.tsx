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
  onAdd?: () => void;
}

export function QualificationEmptyState({
  title,
  description,
  ctaLabel,
  onAdd,
}: QualificationEmptyStateProps) {
  return (
    <Empty className="py-12">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button disabled={!onAdd} variant="outline" size="sm" onClick={onAdd}>
          <Plus data-icon="inline-start" />
          {ctaLabel}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
