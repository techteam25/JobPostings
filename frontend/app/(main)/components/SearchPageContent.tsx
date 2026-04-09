"use client";

import { useCallback, useState } from "react";
import { Bell, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchJobsWrapper } from "@/app/(main)/components/SearchJobsWrapper";
import { DesktopSearchBar } from "@/app/(main)/components/DesktopSearchBar";
import { FeatureErrorBoundary } from "@/components/common/FeatureErrorBoundary";
import { JobTypeDropDownButton } from "@/app/(main)/components/JobTypeDropDownButton";
import { ServiceRoleDropDownButton } from "@/app/(main)/components/ServiceRoleDropDownButton";
import { DatePostedDropDownButton } from "@/app/(main)/components/DatePostedDropDownButton";
import { SearchFilterDropDownButton } from "@/app/(main)/components/SearchFilterDropDownButton";
import { SearchFilterDialogButton } from "@/app/(main)/components/SearchFilterDialogButton";
import { RemoteOnlyBadge } from "@/app/(main)/components/RemoteOnlyBadge";
import { ForYouJobsWrapper } from "@/app/(main)/components/ForYouJobsWrapper";
import { SearchInputMobile } from "@/app/(main)/components/SearchInputMobile";
import { SearchFiltersMobile } from "@/app/(main)/components/SearchFiltersMobile";
import type { ServerActionPaginatedResponse } from "@/lib/types";
import type { JobWithEmployer } from "@/schemas/responses/jobs";

type SearchTab = "foryou" | "search";

interface SearchPageContentProps {
  initialJobs: ServerActionPaginatedResponse<JobWithEmployer>;
}

export function SearchPageContent({ initialJobs }: SearchPageContentProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>("search");

  // Event-driven auto-switch: when either search input commits a new search,
  // pull the user onto the Search tab. Kept as an event handler (not an
  // effect) so we don't cascade renders from Zustand subscriptions.
  const handleSearchCommitted = useCallback(() => {
    setActiveTab("search");
  }, []);

  if (!initialJobs.success) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{initialJobs.message}</p>
      </div>
    );
  }

  return (
    <>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="bg-input flex h-12 items-center justify-start rounded-full shadow-none lg:hidden">
            <SearchInputMobile onSearchCommitted={handleSearchCommitted} />
            <SearchFiltersMobile />
          </div>
          <div className="hidden items-center gap-1 lg:flex">
            <DesktopSearchBar onSearchCommitted={handleSearchCommitted} />
            {/* Mobile: Dialog */}
            <div className="lg:hidden">
              <SearchFilterDialogButton />
            </div>
            {/* Desktop: Dropdown */}
            <div className="hidden lg:block">
              <SearchFilterDropDownButton />
            </div>
          </div>
        </div>
      </section>

      <div className="border-b">
        <div className="mx-auto max-w-7xl px-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as SearchTab)}
            className="w-auto py-3"
          >
            <TabsList className="bg-background h-auto w-full p-0">
              <div className="flex w-full items-center justify-center md:justify-between">
                <div className="md:flex-1" />
                <TabsTrigger
                  value="foryou"
                  className="data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none bg-transparent px-6 data-[state=active]:border-b-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Sparkles className="text-primary mr-1 size-5" /> For You
                </TabsTrigger>
                <TabsTrigger
                  value="search"
                  className="data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none bg-transparent px-6 data-[state=active]:border-b-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Search
                </TabsTrigger>
                <div className="hidden w-full flex-1 justify-end md:flex">
                  <Button
                    variant="ghost"
                    className="text-foreground/85 hover:text-foreground/95 decoration-accent cursor-pointer text-sm decoration-4 underline-offset-8 hover:bg-transparent hover:underline [&_svg]:size-4"
                  >
                    <Bell className="mr-1" />
                    Create job alert
                  </Button>
                </div>
              </div>
            </TabsList>
            {/* Job filters component */}
            <TabsContent value="foryou">
              <FeatureErrorBoundary featureName="recommended jobs">
                <ForYouJobsWrapper />
              </FeatureErrorBoundary>
            </TabsContent>
            <TabsContent value="search" className="w-full">
              <div className="w-full">
                <div className="mx-auto max-w-7xl p-1 sm:p-2 md:p-4">
                  <div className="hidden flex-wrap gap-4 md:flex">
                    <Button className="text-secondary-foreground hover:bg-input bg-secondary cursor-pointer rounded-full px-3 py-4 shadow-none">
                      Easy Apply only
                    </Button>
                    <RemoteOnlyBadge />
                    <JobTypeDropDownButton />
                    <ServiceRoleDropDownButton />
                    <DatePostedDropDownButton />
                  </div>
                </div>
              </div>
              <FeatureErrorBoundary featureName="job listings">
                <SearchJobsWrapper initialJobs={initialJobs} />
              </FeatureErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
