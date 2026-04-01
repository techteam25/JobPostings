import { redirect } from "next/navigation";

import { getUserIntent } from "@/lib/api/users";

import CountdownRedirect from "./components/CountdownRedirect";

export default async function EmailVerifiedPage() {
  const intentResult = await getUserIntent();

  if (intentResult.success && intentResult.data.status === "completed") {
    redirect("/");
  }

  const target =
    intentResult.success &&
    intentResult.data.intent === "seeker" &&
    intentResult.data.status === "pending"
      ? "/welcome"
      : "/";

  return <CountdownRedirect target={target} />;
}
