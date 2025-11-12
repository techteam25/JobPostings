import Image from "next/image";

import CreateOrganizationForm from "@/app/(main)/employer/onboarding/components/CreateOrganizationForm";

import CompanyProfileGraphic from "@/public/company-profile-graphic.png";
import { Stepper } from "@/app/(main)/employer/onboarding/components/Stepper";
export default function CompanyProfileForm() {
  const steps = [
    { title: "Select role", description: "Please, select your role" },
    {
      title: "Create and verify account",
      description: "Verify your email address",
    },
    {
      title: "Create company account",
      description: "Create or join your company",
    },
    { title: "Create job post", description: "Find the perfect candidates" },
  ];

  const currentStep = 3;

  return (
    <div className="flex h-fit justify-center p-4">
      <div className="flex w-full max-w-6xl gap-6">
        {/* Left Panel - Steps */}
        <div className="bg-background w-80 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-8">
            <Image
              src={CompanyProfileGraphic}
              alt="Company Profile Graphic"
              className="h16 mx-auto w-auto"
            />
          </div>

          <h2 className="mb-8 text-xl font-bold">Let's create new account</h2>

          <div className="space-y-6">
            <Stepper steps={steps} currentStep={currentStep} />
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="bg-background flex-1 p-8">
          <h2 className="mb-2 text-2xl font-bold">Company's profile</h2>
          <p className="mb-8 text-gray-500">
            Provide information about your company and other details
          </p>

          <CreateOrganizationForm />

          <div className="mb-6">
            <div className="mb-2 text-sm font-medium text-gray-700">
              26% completed
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-purple-600"
                style={{ width: "26%" }}
              ></div>
            </div>
          </div>

          <button className="w-full rounded-lg bg-indigo-950 py-3 font-medium text-white transition-colors hover:bg-indigo-900">
            Next: add company's info
          </button>
        </div>
      </div>
    </div>
  );
}
