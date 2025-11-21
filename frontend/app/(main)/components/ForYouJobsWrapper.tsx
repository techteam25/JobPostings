import { MdRecommend } from "react-icons/md";

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
          <MdRecommend />
        </EmptyMedia>
        <EmptyTitle>Coming Soon</EmptyTitle>
        <EmptyDescription>
          Personalized job recommendations tailored just for you.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};
