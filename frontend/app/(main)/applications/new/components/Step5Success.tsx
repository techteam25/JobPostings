"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Step5SuccessProps {
  userName: string;
  email: string;
}

export const Step5Success = ({ userName, email }: Step5SuccessProps) => {
  return (
    <div className="animate-in zoom-in py-12 text-center duration-500">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="mb-2 text-3xl font-bold text-slate-900">
        Application Sent!
      </h2>
      <p className="mx-auto mb-8 max-w-sm text-slate-500">
        Thanks for applying, {userName.split(" ")[0]}. We've sent a
        confirmation email to{" "}
        <span className="font-medium text-slate-900">{email}</span>.
      </p>
      <div className="flex justify-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/">View similar jobs</Link>
        </Button>
        <Button asChild>
          <Link href="/applications">View Applications</Link>
        </Button>
      </div>
    </div>
  );
};
