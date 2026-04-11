import { SearchPageContent } from "@/app/(main)/components/SearchPageContent";
import { getJobs } from "@/lib/api";

async function Page() {
  const jobs = await getJobs();
  return <SearchPageContent initialJobs={jobs} />;
}

export default Page;
