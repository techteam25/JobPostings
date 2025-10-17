import RegistrationForm from "@/app/(auth)/_components/registration-form";

import { CheckCircle } from "lucide-react";

function Page() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center rounded-2xl p-4 shadow-2xl">
      <div className="grid w-full max-w-6xl items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
        {/* Left Side - Marketing Content */}
        <div className="text-foreground hidden space-y-6 md:block">
          <div className="inline-block">
            <div className="bg-background flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm">
              <div className="bg-accent flex h-8 w-8 items-center justify-center rounded-full">
                <svg
                  className="text-accent-foreground h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v12M6 12h12" />
                </svg>
              </div>
              <span className="font-semibold">JobFinder</span>
            </div>
          </div>

          <h1 className="text-lg leading-tight font-bold sm:text-2xl md:text-5xl">
            Start Your Career Journey Today
          </h1>
          <p className="text-secondary-foreground text-sm md:text-base lg:text-xl">
            Join thousands of professionals finding their dream jobs. Get
            personalized recommendations and exclusive access to top employers.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="bg-accent mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                <CheckCircle className="text-accent-foreground h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Access 23,000+ Job Listings
                </h3>
                <p className="text-muted-foreground">
                  From startups to Fortune 500 companies
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-accent mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                <CheckCircle className="text-accent-foreground h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI-Powered Matching</h3>
                <p className="text-muted-foreground">
                  Get jobs tailored to your skills and preferences
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-accent mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                <CheckCircle className="text-accent-foreground h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Career Resources</h3>
                <p className="text-muted-foreground">
                  Resume tips, interview prep, and career advice
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted-foreground/10 h-full w-0.5" />
        {/* Right Side - Registration Form */}
        <RegistrationForm />
      </div>
    </div>
  );
}

export default Page;
