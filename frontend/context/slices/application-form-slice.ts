import { StateCreator } from "zustand";
import { JobApplicationInput } from "@/schemas/applications";

export interface ApplicationFormData extends JobApplicationInput {
  resume: File | null;
}

export interface ApplicationFormState {
  step: number;
  formData: ApplicationFormData;
  setStep: (step: number | ((prev: number) => number)) => void;
  setFormData: (
    data:
      | Partial<ApplicationFormData>
      | ((prev: ApplicationFormData) => Partial<ApplicationFormData>),
  ) => void;
  resetForm: () => void;
  initializeForm: (userData: {
    firstName: string;
    lastName: string;
    email: string;
  }) => void;
}

const initialFormData: ApplicationFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  resume: null,
  linkedIn: "",
  website: "",
  coverLetter: "",
  customAnswers: { authorized: undefined as any },
};

export const applicationFormSlice: StateCreator<ApplicationFormState> = (
  set,
) => ({
  step: 1,
  formData: initialFormData,
  setStep: (step) =>
    set((state) => ({
      step: typeof step === "function" ? step(state.step) : step,
    })),
  setFormData: (data) =>
    set((state) => ({
      formData: {
        ...state.formData,
        ...(typeof data === "function" ? data(state.formData) : data),
      },
    })),
  resetForm: () =>
    set({
      step: 1,
      formData: initialFormData,
    }),
  initializeForm: (userData) =>
    set((state) => ({
      formData: {
        ...state.formData,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
      },
    })),
});
