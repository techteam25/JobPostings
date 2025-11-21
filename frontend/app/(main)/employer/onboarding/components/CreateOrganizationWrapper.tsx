"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";

import { steps } from "@/app/(main)/employer/onboarding/steps";

import { Button } from "@/components/ui/button";
import { Stepper } from "@/app/(main)/employer/onboarding/components/Stepper";
import { CreateOrganizationData } from "@/schemas/organizations";

import CompanyProfileGraphic from "@/public/company-profile-graphic.png";
import { useCreateOrganization } from "@/app/(main)/employer/onboarding/hooks/use-create-organization";
import { Loader2 } from "lucide-react";

const CreateOrganizationWrapper = () => {
  const [companyData, setCompanyData] = useState<CreateOrganizationData>({
    name: "",
    industry: "",
    size: "",
    mission: "",
    streetAddress: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    phone: "",
    url: "",
    logo: undefined,
  });
  const [currentStep, setCurrentStep] = useState("general-info");
  const formRef = useRef<any>(null);
  const { isCreatingOrganization, createOrganizationAsync } =
    useCreateOrganization();

  const canGoBack = steps.findIndex((step) => step.key === currentStep) > 0;
  const canGoNext =
    steps.findIndex((step) => step.key === currentStep) < steps.length - 1;
  const isLastStep =
    steps.findIndex((step) => step.key === currentStep) === steps.length - 1;

  const FormComponent = steps.find(
    (step) => step.key === currentStep,
  )?.component;

  const validateAndSubmitCurrentForm = async (): Promise<boolean> => {
    if (!formRef.current) return false;

    // Validate current form
    await formRef.current.validateAllFields("blur");

    const formState = formRef.current.state;
    const hasErrors =
      formState.errors.length > 0 ||
      Object.values(formState.fieldMeta).some((meta: any) => !meta.isValid);

    if (hasErrors) {
      // Touch all fields to show errors
      Object.keys(formState.fieldMeta).forEach((fieldName) => {
        formRef.current?.setFieldMeta(fieldName, (prev: any) => ({
          ...prev,
          isTouched: true,
        }));
      });
      return false;
    }

    // Update companyData with current form values
    formRef.current.handleSubmit();
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateAndSubmitCurrentForm();
    if (!isValid) return;

    const currentIndex = steps.findIndex((step) => step.key === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const handleBack = async () => {
    if (!formRef.current) return;

    // Update companyData with current form values before going back
    formRef.current.handleSubmit();

    const currentIndex = steps.findIndex((step) => step.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const handleSubmit = async () => {
    const isValid = await validateAndSubmitCurrentForm();
    if (!isValid) return;

    const cleanedCompanyData: CreateOrganizationData = {
      ...companyData,
      mission: DOMPurify.sanitize(companyData.mission),
    };

    const formData = new FormData();
    Object.entries(cleanedCompanyData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value as string | Blob);
      }
    });
    await createOrganizationAsync(formData);
  };

  return (
    <div className="flex w-full max-w-6xl gap-6">
      {/* Left Panel - Steps */}
      <div className="bg-background h-fit w-80 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8">
          <Image
            src={CompanyProfileGraphic}
            alt="Company Profile Graphic"
            className="h16 mx-auto w-auto"
          />
        </div>
        <div className="space-y-6">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>
      </div>
      <div className="flex w-full max-w-6xl gap-6">
        {/* Right Panel - Form */}
        <div className="bg-background flex-1 p-8">
          <h2 className="mb-2 text-2xl font-bold">Company's profile</h2>
          <p className="mb-8 text-gray-500">
            Provide information about your company and other details
          </p>

          {FormComponent && (
            <FormComponent
              organization={companyData}
              setOrganizationData={setCompanyData}
              formRef={formRef}
            />
          )}

          <div className="mb-6">
            <div className="text-secondary-foreground mb-2 text-sm font-medium">
              26% completed
            </div>
            <div className="bg-background border-border h-2 w-full rounded-full border">
              <div
                className="bg-chart-1 h-2 rounded-full"
                style={{ width: "26%" }}
              ></div>
            </div>
          </div>
          <div className="flex w-full justify-between gap-4">
            <Button
              onClick={handleBack}
              size="default"
              variant="outline"
              className="text-primary hover:border-primary hover:text-primary w-full cursor-pointer rounded-lg py-3 font-medium shadow-none transition-colors hover:bg-transparent"
              disabled={!canGoBack}
            >
              Previous
            </Button>
            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                size="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full cursor-pointer rounded-lg py-3 font-medium transition-colors [&_svg]:size-5"
                disabled={isCreatingOrganization}
              >
                {isCreatingOrganization ? (
                  <>
                    <Loader2 className="animate-spin" />{" "}
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                size="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full cursor-pointer rounded-lg py-3 font-medium transition-colors"
                disabled={!canGoNext}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganizationWrapper;
