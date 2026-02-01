"use client";

import { Fragment } from "react";
import { Bell, ChevronRight, Mail } from "lucide-react";
import { TbPasswordUser } from "react-icons/tb";

import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function SettingsPage() {
  const settingsOptions = [
    {
      id: "email-preferences",
      icon: Mail,
      title: "Email Settings",
      description: "Manage your email address and preferences",
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      description: "Manage email preferences and job alerts",
    },
    {
      id: "change-password",
      icon: TbPasswordUser,
      title: "Change Password",
      description: "Update your password and security settings",
    },
  ];

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold">Settings</h1>
          <p className="text-secondary-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Settings Options */}
        <div className="space-y-3">
          {settingsOptions.map((option, idx) => {
            const Icon = option.icon;
            return (
              <Fragment key={idx}>
                <button className="group bg-background w-full cursor-pointer p-6 shadow-none transition-all">
                  <Link href={`/settings/${option.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Icon Container */}
                        <div className="bg-secondary flex h-12 w-12 items-center justify-center rounded-full">
                          <Icon
                            size={24}
                            className="bg-secondary text-secondary-foreground"
                          />
                        </div>

                        {/* Text Content */}
                        <div className="text-left">
                          <h3 className="text-foreground mb-1 text-lg font-semibold">
                            {option.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {option.description}
                          </p>
                        </div>
                      </div>

                      {/* Chevron Arrow */}
                      <ChevronRight
                        size={24}
                        className="group-hover:text-secondary-foreground text-muted-foreground transform transition-colors group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                </button>
                <Separator className="border-border my-1.5" />
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
