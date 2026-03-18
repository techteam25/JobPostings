import { ThumbsUp } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
export const ForYouJobsWrapper = () => {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ThumbsUp />
        </EmptyMedia>
        <EmptyTitle>Coming Soon</EmptyTitle>
        <EmptyDescription>
          Personalized job recommendations tailored just for you.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};
