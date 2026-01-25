import { StateCreator } from "zustand";

export interface ApplicationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resume: File | null;
  linkedIn: string;
  website: string;
  q1: string;
  q2: string;
}

export interface ApplicationFormState {
  step: number;
  isDragging: boolean;
  isParsing: boolean;
  formData: ApplicationFormData;
  setStep: (step: number | ((prev: number) => number)) => void;
  setIsDragging: (isDragging: boolean) => void;
  setIsParsing: (isParsing: boolean) => void;
  setFormData: (
    data:
      | Partial<ApplicationFormData>
      | ((prev: ApplicationFormData) => Partial<ApplicationFormData>),
  ) => void;
  resetForm: () => void;
}

const initialFormData: ApplicationFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  resume: null,
  linkedIn: "",
  website: "",
  q1: "",
  q2: "",
};

export const applicationFormSlice: StateCreator<ApplicationFormState> = (
  set,
) => ({
  step: 1,
  isDragging: false,
  isParsing: false,
  formData: initialFormData,
  setStep: (step) =>
    set((state) => ({
      step: typeof step === "function" ? step(state.step) : step,
    })),
  setIsDragging: (isDragging) => set({ isDragging }),
  setIsParsing: (isParsing) => set({ isParsing }),
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
      isDragging: false,
      isParsing: false,
      formData: initialFormData,
    }),
});
