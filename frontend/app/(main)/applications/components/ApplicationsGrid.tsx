import { ApplicationCard } from "./ApplicationCard";

interface ApplicationsGridProps {
  applications: {
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
  }[];
}

export const ApplicationsGrid = ({ applications }: ApplicationsGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {applications.map((app) => (
        <ApplicationCard
          key={`${app.jobId}-${app.appliedAt.getTime()}`}
          application={app}
        />
      ))}
    </div>
  );
};
