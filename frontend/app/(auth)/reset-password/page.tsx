import { Suspense } from "react";
import ResetPasswordForm from "@/app/(auth)/reset-password/components/reset-password-form";

function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-2 py-8 md:px-4">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

export default Page;
