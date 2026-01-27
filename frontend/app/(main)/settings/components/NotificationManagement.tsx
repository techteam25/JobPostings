"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const NotificationPreferences = () => {
  const [notifications, setNotifications] = useState<Record<string, any>>({
    jobMatchNotifications: {
      enabled: true,
      frequency: "instant",
      label: "Job Match Notifications",
      description:
        "Get notified when new jobs match your preferences and skills.",
    },
    applicationStatusNotifications: {
      enabled: true,
      frequency: "instant",
      label: "Application Status Notifications",
      description:
        "Updates on your job applications, interviews, and responses from employers.",
    },
    savedJobUpdates: {
      enabled: true,
      frequency: "daily",
      label: "Saved Job Updates",
      description:
        "Notifications about changes to jobs you've saved or bookmarked.",
    },
    weeklyJobDigest: {
      enabled: false,
      frequency: "weekly",
      label: "Weekly Job Digest",
      description:
        "A curated summary of new job opportunities delivered every week.",
    },
    monthlyNewsletter: {
      enabled: true,
      frequency: "monthly",
      label: "Monthly Newsletter",
      description:
        "Career tips, industry insights, and platform updates once a month.",
    },
    marketingEmails: {
      enabled: false,
      frequency: "weekly",
      label: "Marketing Emails",
      description: "Special offers, new features, and promotional content.",
    },
    accountSecurityAlerts: {
      enabled: true,
      frequency: "instant",
      label: "Account Security Alerts",
      description:
        "Important notifications about login activity and account security.",
      locked: true,
    },
    globalUnsubscribe: {
      enabled: false,
      frequency: "none",
      label: "Unsubscribe from All",
      description:
        "Stop receiving all non-essential email notifications (security alerts will still be sent).",
    },
  });

  const toggleNotification = (key: string) => {
    if (notifications[key].locked) return;

    setNotifications((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled,
      },
    }));
  };

  const updateFrequency = (
    key: string,
    frequency: "instant" | "daily" | "weekly",
  ) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        frequency,
      },
    }));
  };

  const getFrequencyOptions = (key: string) => {
    if (key === "weeklyJobDigest") return ["weekly"];
    if (key === "monthlyNewsletter") return ["monthly"];
    if (key === "globalUnsubscribe") return ["none"];
    if (key === "accountSecurityAlerts") return ["instant"];
    return ["instant", "daily", "weekly"];
  };

  const categories = [
    {
      title: "Job Alerts",
      items: [
        "jobMatchNotifications",
        "applicationStatusNotifications",
        "savedJobUpdates",
      ],
    },
    {
      title: "Newsletters & Updates",
      items: ["weeklyJobDigest", "monthlyNewsletter", "marketingEmails"],
    },
    {
      title: "Account",
      items: ["accountSecurityAlerts", "globalUnsubscribe"],
    },
  ];

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            Notification Preferences
          </h1>
          <p className="text-secondary-foreground">
            Manage your email notification settings and preferences
          </p>
        </div>

        {/* Notification Categories */}
        {categories.map((category, idx) => (
          <div key={idx} className="mb-8">
            <h2 className="text-foreground mb-4 text-xl font-semibold">
              {category.title}
            </h2>
            <div className="space-y-4">
              {category.items.map((key) => {
                const notification = notifications[key];
                const isGlobalUnsubscribe = key === "globalUnsubscribe";

                return (
                  <div
                    key={key}
                    className="border-border bg-background rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="mr-4 flex-1">
                        <div className="mb-2 flex items-center">
                          <h3 className="text-foreground text-lg font-medium">
                            {notification.label}
                          </h3>
                          {notification.locked && (
                            <span className="bg-background text-secondary-foreground ml-2 rounded-full px-2 py-1 text-xs">
                              Required
                            </span>
                          )}
                          {isGlobalUnsubscribe && (
                            <span className="bg-destructive-foreground text-destructive ml-2 rounded-full px-2 py-1 text-xs">
                              Warning
                            </span>
                          )}
                        </div>
                        <p className="text-secondary-foreground text-sm">
                          {notification.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Frequency Dropdown */}
                        {notification.enabled && !isGlobalUnsubscribe && (
                          <div className="relative">
                            <select
                              value={notification.frequency}
                              onChange={(e) =>
                                updateFrequency(
                                  key,
                                  e.target.value as
                                    | "instant"
                                    | "daily"
                                    | "weekly",
                                )
                              }
                              disabled={notification.locked}
                              className="focus:ring-opacity-50 text-foreground focus:ring-accent border-border bg-background appearance-none rounded-lg border px-4 py-2 pr-10 text-sm focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {getFrequencyOptions(key).map((freq) => (
                                <option key={freq} value={freq}>
                                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transform"
                              size={16}
                              color="#262626"
                            />
                          </div>
                        )}

                        {/* Toggle Switch */}
                        <button
                          onClick={() => toggleNotification(key)}
                          disabled={notification.locked}
                          className={cn(
                            `focus:ring-accent relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none`,
                            notification.locked
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer",
                            notification.enabled
                              ? "bg-accent"
                              : "bg-muted-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              `bg-background inline-block h-4 w-4 transform rounded-full transition-transform`,
                              notification.enabled
                                ? "translate-x-6"
                                : "translate-x-1",
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Email Badge */}
        <div className="border-border bg-background mt-8 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-accent h-2 w-2 rounded-full" />
              <span className="text-foreground text-sm font-medium">
                Email notifications enabled
              </span>
            </div>
            <span className="text-secondary-foreground text-xs">
              Changes are saved automatically
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
