"use client";

import { Bell, ChevronRight, Mail } from "lucide-react";
import { TbPasswordUser } from "react-icons/tb";

import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const settingsOptions = [
    {
      id: "email",
      icon: Mail,
      title: "Email Settings",
      description: "Manage your email address and preferences",
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Notifications",
      description: "Choose what we get in touch about",
    },
    {
      id: "password",
      icon: TbPasswordUser,
      title: "Change Password",
      description: "Update your password and security settings",
    },
  ];

  const handleNavigation = (optionId: string) => {
    // This is where you'd handle navigation to different pages
    // For now, just logging - you can replace with your router navigation
    console.log(`Navigating to: ${optionId}`);
    // Example: navigate(`/settings/${optionId}`);
  };

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
          {settingsOptions.map((option) => {
            const Icon = option.icon;
            return (
              <>
                <button
                  key={option.id}
                  onClick={() => handleNavigation(option.id)}
                  className="group bg-background w-full cursor-pointer p-6 shadow-none transition-all"
                >
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
                </button>
                <Separator className="border-border my-1.5" />
              </>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="border-border bg-background mt-8 rounded-lg border p-4">
          <p className="text-secondary-foreground text-center text-sm">
            Need help? Contact our support team at{" "}
            <a
              href="mailto:support@yourapp.com"
              className="text-accent font-medium hover:underline"
            >
              support@yourapp.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
