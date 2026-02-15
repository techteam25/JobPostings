import { redirect } from "next/navigation";
import { getUserOrganizations } from "@/lib/api";
import OrgPicker from "./components/org-picker";

export default async function EmployerOrganizationsPage() {
  const result = await getUserOrganizations();

  if (!result.success || !result.data || result.data.length === 0) {
    redirect("/employer/onboarding");
  }

  if (result.data.length === 1) {
    redirect(`/employer/organizations/${result.data[0].organizationId}`);
  }

  return <OrgPicker organizations={result.data} />;
}
