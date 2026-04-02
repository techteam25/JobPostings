"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function CountdownRedirect({ target }: { target: string }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      router.replace(target);
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router, target]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-accent mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
          <CheckCircle2 className="text-primary size-8" />
        </div>

        <h1 className="text-foreground mb-2 text-2xl font-bold">
          Email verified!
        </h1>

        <p className="text-muted-foreground mb-6">
          Your email has been successfully verified. You&apos;ll be redirected
          in {countdown} second{countdown !== 1 ? "s" : ""}.
        </p>

        <Button
          onClick={() => router.replace(target)}
          className="bg-primary hover:bg-priamry/90 text-primary-foreground w-full cursor-pointer"
        >
          Go now
        </Button>
      </div>
    </div>
  );
}
