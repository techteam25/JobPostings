import Image from "next/image";

import RegistrationForm from "@/app/(auth)/components/registration-form";

import GetInvolvedLogo from "@/public/GetInvolved_Logo.png";

import { CheckCircle } from "lucide-react";

function Page() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center rounded-2xl shadow-2xl">
      <div className="grid w-full max-w-6xl items-center gap-8 p-2 md:grid-cols-[1fr_auto_1fr] lg:p-4">
        {/* Left Side - Marketing Content */}
        <div className="text-foreground hidden space-y-6 px-4 lg:block">
          <div className="inline-block">
            <div className="bg-background flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm">
              <Image
                src={GetInvolvedLogo}
                alt="Get Involved Logo"
                className="mx-auto h-20 w-auto"
              />
            </div>
          </div>

          <h1 className="sm:text-md text-foreground text-sm leading-tight font-bold md:text-xl">
            Connecting Ministries with those called to serve
          </h1>
          <p className="text-secondary-foreground hidden text-sm md:text-base lg:text-xl xl:block">
            Join ministries and individuals answering the call to serve.
            Discover opportunities to use your gifts where they are needed most.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="bg-accent mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                <CheckCircle className="text-accent-foreground h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Explore Service Opportunities
                </h3>
                <p className="text-muted-foreground">
                  From national faith organizations to global missions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-accent mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                <CheckCircle className="text-accent-foreground h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Purpose-Driven Matching
                </h3>
                <p className="text-muted-foreground">
                  AI-assisted matching based on your calling and experience
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-accent mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                <CheckCircle className="text-accent-foreground h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Support & Development</h3>
                <p className="text-muted-foreground">
                  Training, mentorship, and career growth for ministry workers
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
