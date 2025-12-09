import { useQuery } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";
import { JobResponse, JobWithEmployer } from "@/schemas/responses/jobs";
import { toast } from "sonner";
import { PaginatedApiResponse } from "@/lib/types";

export const useFetchJobs = (
  initialData: PaginatedApiResponse<JobWithEmployer>,
) => {
  const {
    data,
    error,
    isPending: fetchingJobs,
    isError,
  } = useQuery({
    queryKey: ["fetch-jobs"],
    queryFn: async () => {
      const response =
        await instance.get<PaginatedApiResponse<JobWithEmployer>>("/jobs");
      return response.data;
    },
    initialData,
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
