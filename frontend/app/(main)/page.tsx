import { headers } from "next/headers";

import { SearchPageContent } from "@/app/(main)/components/SearchPageContent";
import { getJobs } from "@/lib/api";
import { parseSessionCookie } from "@/lib/session-cookie";

async function Page() {
  const hdrs = await headers();
  const parsed = parseSessionCookie(hdrs.get("cookie"));
  const isAuthenticated = parsed !== null;

  const jobs = await getJobs();
  return (
    <SearchPageContent initialJobs={jobs} isAuthenticated={isAuthenticated} />
  );
}

export default Page;
