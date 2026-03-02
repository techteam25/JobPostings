"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function EmailVerifiedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      router.replace("/");
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>

        <h1 className="text-foreground mb-2 text-2xl font-bold">
          Email verified!
        </h1>

        <p className="text-muted-foreground mb-6">
          Your email has been successfully verified. You&apos;ll be redirected
          in {countdown} second{countdown !== 1 ? "s" : ""}.
        </p>

        <Button
          onClick={() => router.replace("/")}
          className="bg-accent hover:bg-accent/90 text-accent-foreground w-full cursor-pointer"
        >
          Go now
        </Button>
      </div>
    </div>
  );
}
