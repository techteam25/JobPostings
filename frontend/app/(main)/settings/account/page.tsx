import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getUserInformation } from "@/lib/api/users";
import { parseSessionCookie } from "@/lib/session-cookie";

import AccountSettingsContent from "./components/AccountSettingsContent";

export const metadata = {
  title: "Account Settings",
};

export default async function AccountSettingsPage() {
  const hdrs = await headers();
  const parsed = parseSessionCookie(hdrs.get("cookie"));

  if (parsed?.kind === "full") {
    return (
      <AccountSettingsContent
        fullName={parsed.user.name}
        email={parsed.user.email}
        intent={parsed.user.intent}
      />
    );
  }

  void cookies(); // Touch cookies so Next includes them in the API fetch.
  const userRes = await getUserInformation();
  if (!userRes.success) {
    redirect("/sign-in");
  }

  return (
    <AccountSettingsContent
      fullName={userRes.data.fullName}
      email={userRes.data.email}
      intent="seeker"
    />
  );
}
