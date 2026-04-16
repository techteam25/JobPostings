import Link from "next/link";
import { UserRoundPen } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ProfileCompletionNudge() {
  return (
    <Card className="border-primary/20 bg-primary/5 mb-4">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <UserRoundPen className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            Complete your profile to get personalized recommendations
          </p>
          <p className="text-muted-foreground text-xs">
            Add your skills and preferences so we can match you with the right
            opportunities.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/me/profile">Complete Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
