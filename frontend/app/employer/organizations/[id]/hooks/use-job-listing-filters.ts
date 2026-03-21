import { useMemo, useState } from "react";
import { Job } from "@/schemas/responses/jobs";

export function useJobListingFilters(jobs: Job[]) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Tab filtering
    switch (activeTab) {
      case "open":
        filtered = filtered.filter((j) => j.isActive);
        break;
      case "expiring":
        filtered = filtered.filter((j) => {
          if (!j.applicationDeadline || !j.isActive) return false;
          const deadline = new Date(j.applicationDeadline);
          const now = new Date();
          const daysUntil = Math.ceil(
            (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );
          return daysUntil <= 7 && daysUntil >= 0;
        });
        break;
      case "expired":
        filtered = filtered.filter((j) => !j.isActive);
        break;
    }

    // Search filtering
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(lower) ||
          j.city.toLowerCase().includes(lower),
      );
    }

    return filtered;
  }, [jobs, activeTab, searchTerm]);

  return { activeTab, setActiveTab, searchTerm, setSearchTerm, filteredJobs };
}
