import { MapPin, Search } from "lucide-react";
import { BsBellFill } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobsWrapper from "@/app/(main)/components/JobsWrapper";
import { JobTypeDropDownButton } from "@/app/(main)/components/JobTypeDropDownButton";
import { ServiceRoleDropDownButton } from "@/app/(main)/components/ServiceRoleDropDownButton";
import { DatePostedDropDownButton } from "@/app/(main)/components/DatePostedDropDownButton";
import { SearchFilterDropDownButton } from "./components/SearchFilterDropDownButton";
import { RemoteOnlyBadge } from "@/app/(main)/components/RemoteOnlyBadge";
import { UserProfileStatusBanner } from "@/app/(main)/components/UserProfileStatusBanner";
import { ForYouJobsWrapper } from "@/app/(main)/components/ForYouJobsWrapper";

function Page() {
  return (
    <>
      <section className="border-b">
        <div className="flex items-center justify-center gap-1">
          <UserProfileStatusBanner />
        </div>
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-1">
            <div className="relative flex-1">
              <Search className="text-secondary-foreground absolute top-1/2 left-3 mr-1 size-6 -translate-y-1/2" />
              <Input
                placeholder="Find your next job"
                className="text-secondary-foreground border-input bg-input h-12 rounded-none rounded-l-full pl-10 text-lg shadow-none outline-none focus-visible:ring-0"
              />
            </div>
            <div className="relative w-64">
              <MapPin className="text-secondary-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
              <Input
                placeholder="Location"
                className="text-secondary-foreground border-input bg-input h-12 rounded-none rounded-r-full pl-10 text-lg shadow-none outline-none focus-visible:ring-0"
              />
            </div>
            <SearchFilterDropDownButton />
          </div>
        </div>
      </section>

      <div className="border-b">
        <div className="mx-auto max-w-7xl px-4">
          <Tabs defaultValue="search" className="w-auto">
            <TabsList className="h-auto w-full border-0">
              <div className="flex w-full items-center justify-between">
                <div className="flex-1" />
                <TabsTrigger
                  value="foryou"
                  className="data-[state=active]:border-accent data-[state=active]:text-foreground rounded-none bg-transparent px-6 py-4 data-[state=active]:border-b-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <HiSparkles className="mr-1" /> For You
                </TabsTrigger>
                <TabsTrigger
                  value="search"
                  className="data-[state=active]:border-accent data-[state=active]:text-foreground rounded-none bg-transparent px-6 py-4 data-[state=active]:border-b-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Search
                </TabsTrigger>
                <div className="flex w-full flex-1 justify-end">
                  <Button
                    variant="ghost"
                    className="text-foreground/85 hover:text-foreground/95 decoration-accent cursor-pointer text-sm decoration-4 underline-offset-8 hover:bg-transparent hover:underline [&_svg]:size-4"
                  >
                    <BsBellFill className="mr-1" />
                    Create job alert
                  </Button>
                </div>
              </div>
            </TabsList>
            {/* Job filters component */}
            <TabsContent value="foryou">
              <ForYouJobsWrapper />
            </TabsContent>
            <TabsContent value="search" className="w-full">
              <div className="w-full border-b">
                <div className="mx-auto max-w-7xl p-4">
                  <div className="flex flex-wrap gap-4">
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
              <JobsWrapper />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

export default Page;
