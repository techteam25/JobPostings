import { useApplicationStore } from "@/context/store";

// This hook is deprecated - components now use useApplicationStore directly
// Kept for backward compatibility if needed
export const useApplicationForm = () => {
  const { step, formData, setStep, setFormData, resetForm } =
    useApplicationStore();

  return {
    step,
    formData,
    setStep,
    setFormData,
    resetForm,
  };
};
