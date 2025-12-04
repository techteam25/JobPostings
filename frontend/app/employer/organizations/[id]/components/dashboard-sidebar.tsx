import {
  BarChart3,
  Calendar,
  HelpCircle,
  Home,
  MessageSquare,
  Settings,
} from "lucide-react";

interface AppSidebarProps {
  organizationName: string;
  organizationLogoUrl: string | null;
}
export function AppSidebar({
  organizationName,
  organizationLogoUrl,
}: AppSidebarProps) {
  return (
    <div className="bg-background flex h-full w-64 flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b p-4">
        {organizationLogoUrl && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg">
            <img
              src={organizationLogoUrl}
              alt={organizationName}
              className="size-8"
            />
          </div>
        )}
        <span className="flex-wrap text-lg font-bold">{organizationName}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        <a
          href="#"
          className="text-secondary-foreground hover:bg-background flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
        >
          <Home size={20} />
          <span>Home</span>
        </a>

        <a
          href="#"
          className="text-secondary-foreground hover:bg-background flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
        >
          <BarChart3 size={20} />
          <span>Analytics</span>
        </a>

        <a
          href="#"
          className="text-secondary-foreground hover:bg-background flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
        >
          <Calendar size={20} />
          <span>Calendar</span>
        </a>

        <a
          href="#"
          className="bg-primary text-primary-foreground flex items-center gap-3 rounded-lg px-3 py-2"
        >
          <Settings size={20} />
          <span>Settings</span>
        </a>

        <a
          href="#"
          className="text-secondary-foreground hover:bg-background flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
        >
          <HelpCircle size={20} />
          <span>Help</span>
        </a>

        <a
          href="#"
          className="text-secondary-foreground hover:bg-background flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
        >
          <MessageSquare size={20} />
          <span>Feedback</span>
        </a>
      </nav>
    </div>
  );
}
