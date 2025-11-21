import { useQuery } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";
import type { JobResponse, JobsResponse } from "@/schemas/responses/jobs";
import { toast } from "sonner";

export const useFetchJobs = () => {
  const {
    data,
    error,
    isPending: fetchingJobs,
    isError,
  } = useQuery({
    queryKey: ["fetch-jobs"],
    queryFn: async () => {
      const response = await instance.get<JobsResponse>("/jobs");
      return response.data;
    },
  });

  if ((data && !data.success) || isError) {
    toast.success("Could not fetch jobs at this time.");
  }

  return { data, error, fetchingJobs };
};

export const useFetchJobDetails = (jobId: number | undefined) => {
  const {
    error: fetchJobDetailsError,
    isPending: fetchingJobDetails,
    data,
  } = useQuery({
    queryKey: ["job-details", jobId],
    queryFn: async () => {
      const response = await instance.get<JobResponse>(`/jobs/${jobId}`);

      return response.data;
    },
    enabled: !!jobId,
  });

  return { data, fetchJobDetailsError, fetchingJobDetails };
};
