import { useApplicationStore } from "@/context/store";

const initialFormData = {
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

describe("applicationFormSlice", () => {
  beforeEach(() => {
    useApplicationStore.setState({
      step: 1,
      formData: { ...initialFormData, customAnswers: { ...initialFormData.customAnswers } },
    });
  });

  it("defaults to step 1 with empty form data", () => {
    const state = useApplicationStore.getState();
    expect(state.step).toBe(1);
    expect(state.formData.resume).toBeNull();
    expect(state.formData.country).toBe("");
    expect(state.formData.customAnswers.salvationStatement).toBe("");
  });

  it("sets step with a number", () => {
    useApplicationStore.getState().setStep(3);
    expect(useApplicationStore.getState().step).toBe(3);
  });

  it("sets step with a functional update", () => {
    useApplicationStore.getState().setStep(2);
    useApplicationStore.getState().setStep((prev) => prev + 1);
    expect(useApplicationStore.getState().step).toBe(3);
  });

  it("updates form data with a partial object", () => {
    useApplicationStore.getState().setFormData({ country: "US", city: "NYC" });
    const { formData } = useApplicationStore.getState();
    expect(formData.country).toBe("US");
    expect(formData.city).toBe("NYC");
    expect(formData.resume).toBeNull();
  });

  it("updates form data with a functional update", () => {
    useApplicationStore.getState().setFormData({ country: "US" });
    useApplicationStore.getState().setFormData((prev) => ({
      city: prev.country + "-city",
    }));
    expect(useApplicationStore.getState().formData.city).toBe("US-city");
  });

  it("initializes form with profile data", () => {
    useApplicationStore
      .getState()
      .initializeForm({ country: "US", city: "NYC", state: "NY", zipcode: "10001" });

    const { formData } = useApplicationStore.getState();
    expect(formData.country).toBe("US");
    expect(formData.city).toBe("NYC");
    expect(formData.state).toBe("NY");
    expect(formData.zipcode).toBe("10001");
    expect(formData.resume).toBeNull();
  });

  it("initializes form with null values as empty strings", () => {
    useApplicationStore.getState().initializeForm({ country: null, city: null });

    const { formData } = useApplicationStore.getState();
    expect(formData.country).toBe("");
    expect(formData.city).toBe("");
  });

  it("resets form to initial state", () => {
    useApplicationStore.getState().setStep(4);
    useApplicationStore.getState().setFormData({ country: "US", city: "NYC" });

    useApplicationStore.getState().resetForm();

    const state = useApplicationStore.getState();
    expect(state.step).toBe(1);
    expect(state.formData.country).toBe("");
    expect(state.formData.city).toBe("");
  });
});
