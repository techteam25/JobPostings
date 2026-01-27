"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import PreferenceToggle from "./PreferenceToggle";

interface Preference {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  context: "job_seeker" | "employer" | "global";
  locked?: boolean;
}

interface PreferenceSectionProps {
  title: string;
  description: string;
  isUnsubscribed: boolean;
  onUnsubscribe: () => void;
  onResubscribe?: () => void;
  preferences: Preference[];
  onTogglePreference: (
    key: string,
    currentValue: boolean,
    context: "job_seeker" | "employer" | "global"
  ) => void;
  disabled: boolean;
  showGlobalUnsubscribe?: boolean;
}

export default function PreferenceSection({
  title,
  description,
  isUnsubscribed,
  onUnsubscribe,
  onResubscribe,
  preferences,
  onTogglePreference,
  disabled,
  showGlobalUnsubscribe,
}: PreferenceSectionProps) {
  return (
    <Card className="mb-6 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {isUnsubscribed && onResubscribe ? (
          <Button variant="outline" size="sm" onClick={onResubscribe}>
            Re-subscribe
          </Button>
        ) : !showGlobalUnsubscribe ? (
          <Button variant="destructive" size="sm" onClick={onUnsubscribe}>
            Unsubscribe from All
          </Button>
        ) : null}
      </div>

      <Separator className="my-4" />

      <div className="space-y-4">
        {preferences.map((pref) => (
          <PreferenceToggle
            key={pref.key}
            label={pref.label}
            description={pref.description}
            enabled={pref.enabled}
            disabled={disabled || pref.locked}
            onToggle={() =>
              onTogglePreference(pref.key, pref.enabled, pref.context)
            }
          />
        ))}
      </div>

      {showGlobalUnsubscribe && (
        <>
          <Separator className="my-4" />
          <div className="mt-6">
            <Button variant="destructive" onClick={onUnsubscribe} disabled={disabled}>
              Unsubscribe from All Emails
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
