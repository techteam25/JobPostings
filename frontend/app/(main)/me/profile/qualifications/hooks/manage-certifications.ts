import { useState, useEffect } from "react";
import { useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

import { instance } from "@/lib/axios-instance";
import { revalidateUserProfile } from "@/lib/api/users";
import type { Certification } from "@/lib/types";

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export const useSearchCertifications = (query: string) => {
  const debouncedQuery = useDebouncedValue(query, 300);

  return useQuery<Certification[]>({
    queryKey: ["certifications-search", debouncedQuery],
    queryFn: async () => {
      const response = await instance.get(
        `/users/me/certifications/search?q=${encodeURIComponent(debouncedQuery)}`,
        { withCredentials: true },
      );
      return response.data.data;
    },
    enabled: debouncedQuery.length >= 1,
    placeholderData: keepPreviousData,
  });
};

export const useLinkCertification = () => {
  return useMutation({
    mutationFn: async (certificationName: string) => {
      const response = await instance.post(
        "/users/me/certifications",
        { certificationName },
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Certification added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add certification");
    },
  });
};

export const useUnlinkCertification = () => {
  return useMutation({
    mutationFn: async (certificationId: number) => {
      const response = await instance.delete(
        `/users/me/certifications/${certificationId}`,
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Certification removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove certification");
    },
  });
};
