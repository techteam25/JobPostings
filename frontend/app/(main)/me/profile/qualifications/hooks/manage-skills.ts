import { useState, useEffect } from "react";
import { useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

import { instance } from "@/lib/axios-instance";
import { revalidateUserProfile } from "@/lib/api/users";
import type { Skill } from "@/lib/types";

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export const useSearchSkills = (query: string) => {
  const debouncedQuery = useDebouncedValue(query, 300);

  return useQuery<Skill[]>({
    queryKey: ["skills-search", debouncedQuery],
    queryFn: async () => {
      const response = await instance.get(
        `/users/me/skills/search?q=${encodeURIComponent(debouncedQuery)}`,
        { withCredentials: true },
      );
      return response.data.data;
    },
    enabled: debouncedQuery.length >= 1,
    placeholderData: keepPreviousData,
  });
};

export const useLinkSkill = () => {
  return useMutation({
    mutationFn: async (skillName: string) => {
      const response = await instance.post(
        "/users/me/skills",
        { skillName },
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Skill added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add skill");
    },
  });
};

export const useUnlinkSkill = () => {
  return useMutation({
    mutationFn: async (skillId: number) => {
      const response = await instance.delete(`/users/me/skills/${skillId}`, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      revalidateUserProfile();
      toast.success("Skill removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove skill");
    },
  });
};
