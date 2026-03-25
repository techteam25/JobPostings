import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function ProfileBreadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm leading-5">
        <li className="flex h-5 items-center">
          <Link
            href="/me/profile"
            className="text-secondary-foreground hover:text-foreground inline-flex h-5 items-center gap-0.5 font-medium transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back to Profile
          </Link>
        </li>
      </ol>
    </nav>
  );
}
