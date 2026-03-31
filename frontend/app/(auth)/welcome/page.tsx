import { redirect } from "next/navigation";

import { getUserIntent } from "@/lib/api";
import { WelcomeForm } from "./components/WelcomeForm";

export default async function WelcomePage() {
  const result = await getUserIntent();

  if (result.success && result.data.status === "completed") {
    redirect("/");
  }

  return <WelcomeForm />;
}
