import Image from "next/image";

import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

import GetInvolvedLogo from "@/public/GetInvolved_Logo.png";

export default function Navbar() {
  return (
    <nav className="mb-6 w-full py-4">
      <div className="mx-auto">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="rounded-2xl px-4 py-2">
              <Image
                src={GetInvolvedLogo}
                alt="Get Involved Logo"
                className="h-14 w-auto"
              />
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <Button
                variant="link"
                className="rounded-2xl px-6 py-2 text-xs text-gray-700 transition hover:bg-gray-50 md:text-sm"
              >
                Explore Job
              </Button>
              <Button
                variant="link"
                className="rounded-2xl px-6 py-2 text-xs text-gray-700 transition hover:bg-gray-50 md:text-sm"
              >
                Saved Jobs
              </Button>
              <Button
                variant="link"
                className="rounded-2xl px-6 py-2 text-xs text-gray-700 transition hover:bg-gray-50 md:text-sm"
              >
                Applications
              </Button>
              <Button
                variant="link"
                className="rounded-2xl px-6 py-2 text-xs text-gray-700 transition hover:bg-gray-50 md:text-sm"
              >
                Messages
              </Button>
              <Button
                variant="link"
                className="rounded-2xl px-6 py-2 text-xs text-gray-700 transition hover:bg-gray-50 md:text-sm"
              >
                FAQ
              </Button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <Button
              variant="outline"
              size="icon"
              className="rounded-full p-2 transition hover:bg-gray-50"
            >
              <Bell className="h-6 w-6 text-gray-700" />
            </Button>

            {/* User Profile */}
            <div className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-gray-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                <svg
                  className="h-6 w-6 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">
                  Ronald Roberts
                </div>
                <div className="text-xs text-gray-500">
                  ronaldroberts@gmail.com
                </div>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
