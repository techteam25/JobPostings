import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BsBookmarkFill } from "react-icons/bs";

const SavedJobsPage = () => {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BsBookmarkFill />
        </EmptyMedia>
        <EmptyTitle>Coming Soon</EmptyTitle>
        <EmptyDescription>
          My Saved Jobs feature is under development. Stay tuned for updates!
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};

export default SavedJobsPage;
