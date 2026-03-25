import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProfileBreadcrumbProps {
  currentPage: string;
}

export function ProfileBreadcrumb({ currentPage }: ProfileBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm leading-5">
        <li className="flex h-5 items-center">
          <Link
            href="/me/profile"
            className="text-muted-foreground hover:text-foreground -ml-1 inline-flex h-5 items-center gap-0.5 transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back to Profile
          </Link>
        </li>
        <li role="separator" className="flex h-5 items-center">
          <ChevronRight className="text-muted-foreground/50 size-4" />
        </li>
        <li className="flex h-5 items-center">
          <span className="text-foreground font-medium">{currentPage}</span>
        </li>
      </ol>
    </nav>
  );
}
