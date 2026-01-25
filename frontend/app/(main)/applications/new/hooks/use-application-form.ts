import { useApplicationStore } from "@/context/store";

export const useApplicationForm = () => {
  const {
    step,
    isDragging,
    isParsing,
    formData,
    setStep,
    setIsDragging,
    setIsParsing,
    setFormData,
    resetForm,
  } = useApplicationStore();

  const handleFileUpload = (file: File) => {
    setIsParsing(true);
    // Simulate API delay
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev, // setFormData in slice merges updates, so spread prev is technically redundant if I pass partial, but the slice implementation: {...state.formData, ...data}.
        // However, slice supports functional update: data(state.formData).
        // So if I pass a function here, it matches the slice signature.
        // But wait, my setFormData implementation allows passing a function.
        // const newFormData = { ...prev, resume: file, ... }
        // So I can return the partial object directly or use function.

        // Let's use the function pattern correctly as required by slice.
        // Actually, I can just simpler update:
        resume: file,
        firstName: "Alex",
        lastName: "Design",
        email: "alex@example.com",
      }));
      setIsParsing(false);
      setStep(2);
    }, 1500);
  };

  return {
    step,
    isDragging,
    isParsing,
    formData,
    setStep,
    setIsDragging,
    setIsParsing,
    setFormData,
    handleFileUpload,
    resetForm,
  };
};
