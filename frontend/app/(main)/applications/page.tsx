import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TbFileStack } from "react-icons/tb";
const MyApplicationsPage = () => {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TbFileStack />
        </EmptyMedia>
        <EmptyTitle>Coming Soon</EmptyTitle>
        <EmptyDescription>
          My Applications feature is under development. Stay tuned for updates!
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};

export default MyApplicationsPage;
