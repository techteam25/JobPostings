import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { instance } from "@/lib/axios-instance";
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
    queryKey: ["candidate-skills-search", debouncedQuery],
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
