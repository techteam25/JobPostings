import { ComponentType } from "react";

import { TCreateOrganizationFormProps } from "@/lib/types";
import GeneralCompanyInfoForm from "./components/forms/GeneralCompanyInfoForm";
import LocationInfoForm from "./components/forms/LocationInfoForm";
import ContactInfoForm from "./components/forms/ContactInfoForm";

export const steps: {
  title: string;
  component: ComponentType<TCreateOrganizationFormProps>;
  key: string;
  description: string;
}[] = [
  {
    title: "General Info",
    component: GeneralCompanyInfoForm,
    key: "general-info",
    description: "Provide general information about your company",
  },
  {
    title: "Location Info",
    component: LocationInfoForm,
    key: "location-info",
    description: "Provide location details of your company",
  },
  {
    title: "Contact Info",
    component: ContactInfoForm,
    key: "contact-info",
    description: "Provide contact details for your company",
  },
];
