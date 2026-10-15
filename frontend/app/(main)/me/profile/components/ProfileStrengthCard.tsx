"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ProfileStrengthCardProps = {
  percentage: number;
  label: string;
  missing: Array<{ id: string; label: string; href: string }>;
};

export default function ProfileStrengthCard({
  percentage,
  label,
  missing,
}: ProfileStrengthCardProps) {
  const showMissing = percentage > 70 && missing.length > 0;

  return (
    <Card className="border-border bg-secondary">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-foreground mb-1 font-bold">
              Profile Strength: {label}
            </h3>
            <p className="text-secondary-foreground text-sm">
              Your profile is {percentage}% complete
            </p>
          </div>
          <Badge className="text-primary-foreground bg-ring">
            {percentage}%
          </Badge>
        </div>
        <div className="bg-input mb-3 h-2.5 w-full rounded-full">
          <div
            className="bg-ring h-2.5 rounded-full"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        {showMissing ? (
          <div className="text-secondary-foreground text-xs">
            <p className="mb-2">To reach 100%, finish these:</p>
            <ul className="list-disc space-y-1 pl-5">
              {missing.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="underline underline-offset-2 hover:no-underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : percentage === 100 ? (
          <p className="text-secondary-foreground text-xs">
            Your profile is complete
          </p>
        ) : (
          <p className="text-secondary-foreground text-xs">
            Complete more of your profile to increase your visibility to
            employers
          </p>
        )}
      </CardContent>
    </Card>
  );
}
