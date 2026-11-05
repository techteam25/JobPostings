import { useQuery } from "@tanstack/react-query";

import { getJobById } from "@/lib/api";

export const useFetchJobDetails = (jobId: number | undefined) => {
  const {
    error: fetchJobDetailsError,
    isPending: fetchingJobDetails,
    data,
  } = useQuery({
    queryKey: ["job-details", jobId],
    queryFn: () => getJobById(jobId!),
    enabled: !!jobId,
  });

  return { data, fetchJobDetailsError, fetchingJobDetails };
};
