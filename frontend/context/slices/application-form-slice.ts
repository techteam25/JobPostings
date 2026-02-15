import { StateCreator } from "zustand";

export interface ApplicationFormData {
  resume: File | null;
  coverLetter: File | null;
  country: string;
  city: string;
  state: string;
  zipcode: string;
  customAnswers: {
    salvationStatement: string;
    race: string;
    gender: "Male" | "Female" | undefined;
    veteranStatus: string;
    yearsOfExperience: string;
    authorized: "yes" | "no" | undefined;
  };
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
  initializeForm: (profileData: {
    country?: string | null;
    city?: string | null;
    state?: string | null;
    zipcode?: string | null;
  }) => void;
}

const initialFormData: ApplicationFormData = {
  resume: null,
  coverLetter: null,
  country: "",
  city: "",
  state: "",
  zipcode: "",
  customAnswers: {
    salvationStatement: "",
    race: "",
    gender: undefined,
    veteranStatus: "",
    yearsOfExperience: "",
    authorized: undefined,
  },
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
  initializeForm: (profileData) =>
    set((state) => ({
      formData: {
        ...state.formData,
        country: profileData.country || "",
        city: profileData.city || "",
        state: profileData.state || "",
        zipcode: profileData.zipcode || "",
      },
    })),
});
