import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import RegistrationForm from "../registration-form";

const mockPost = vi.fn();
const mockHandleSocialAuth = vi.fn();

// Registration now uses window.location.href for hard navigation
const originalLocation = window.location;
beforeEach(() => {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...originalLocation, href: "" },
  });
});
afterEach(() => {
  Object.defineProperty(window, "location", {
    writable: true,
    value: originalLocation,
  });
});

vi.mock("@/lib/axios-instance", () => ({
  instance: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock("@/app/(auth)/sign-in/hooks/use-social", () => ({
  useSocialAuth: () => ({
    handleSocialAuth: mockHandleSocialAuth,
    isSocialPending: false,
  }),
}));

vi.mock("@/hooks/use-local-storage", () => ({
  default: vi.fn(() => ["seeker", vi.fn()]),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("RegistrationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form heading", () => {
    render(<RegistrationForm />);
    expect(
      screen.getByRole("heading", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("renders account type selector", () => {
    render(<RegistrationForm />);
    expect(
      screen.getByRole("button", { name: /job seeker/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /employer/i }),
    ).toBeInTheDocument();
  });

  it("renders all personal info fields", () => {
    render(<RegistrationForm />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("renders password fields", () => {
    render(<RegistrationForm />);
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("renders terms checkbox and register button", () => {
    render(<RegistrationForm />);
    expect(screen.getByText(/terms & conditions/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register/i }),
    ).toBeInTheDocument();
  });

  it("renders social auth buttons in register mode", () => {
    render(<RegistrationForm />);
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /linkedin/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/or sign up with/i)).toBeInTheDocument();
  });

  it("renders sign in link", () => {
    render(<RegistrationForm />);
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("register button is disabled when terms are not agreed", () => {
    render(<RegistrationForm />);
    expect(screen.getByRole("button", { name: /register/i })).toBeDisabled();
  });

  it("shows validation error when first name is cleared", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.type(firstNameInput, "J");
    await user.clear(firstNameInput);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, "short");

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("submits form successfully and redirects to verify-email", async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValue({
      status: 200,
      data: { user: { intent: "seeker" } },
    });

    render(<RegistrationForm />);

    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(
      screen.getByLabelText(/email address/i),
      "john@example.com",
    );
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");

    // Agree to terms
    const termsCheckbox = screen.getByRole("checkbox");
    await user.click(termsCheckbox);

    // Submit
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/auth/sign-up/email", {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        intent: "seeker",
      });
    });

    await waitFor(() => {
      expect(window.location.href).toBe(
        "/verify-email?email=john%40example.com",
      );
    });
  });

  it("shows error toast on failed registration", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    const axiosError = new Error("Request failed") as Error & {
      isAxiosError: boolean;
      response: { data: { message: string } };
    };
    axiosError.isAxiosError = true;
    axiosError.response = { data: { message: "Email already exists" } };
    mockPost.mockRejectedValue(axiosError);

    render(<RegistrationForm />);

    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(
      screen.getByLabelText(/email address/i),
      "john@example.com",
    );
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");

    const termsCheckbox = screen.getByRole("checkbox");
    await user.click(termsCheckbox);

    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email already exists");
    });
  });

  it("calls handleSocialAuth with google", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.click(screen.getByRole("button", { name: /google/i }));
    expect(mockHandleSocialAuth).toHaveBeenCalledWith("google");
  });

  it("calls handleSocialAuth with linkedin", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.click(screen.getByRole("button", { name: /linkedin/i }));
    expect(mockHandleSocialAuth).toHaveBeenCalledWith("linkedin");
  });
});
