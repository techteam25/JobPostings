import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import LoginForm from "../login-form";

const mockReplace = vi.fn();
const mockHandleSocialAuth = vi.fn();
const mockSignInEmail = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element, @typescript-eslint/no-explicit-any
  default: (props: any) => <img {...props} />,
}));

vi.mock("@/lib/auth", () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => mockSignInEmail(...args),
    },
  },
}));

vi.mock("@/app/(auth)/sign-in/hooks/use-social", () => ({
  useSocialAuth: () => ({
    handleSocialAuth: mockHandleSocialAuth,
    isSocialPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form elements", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("heading", { name: /sign in to your account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /login/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /forgot password/i }),
    ).toBeInTheDocument();
  });

  it("renders social auth buttons", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("button", { name: /google/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /linkedin/i }),
    ).toBeInTheDocument();
  });

  it("renders sign up link", () => {
    render(<LoginForm />);

    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/sign-up",
    );
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    // Find the toggle button (the eye icon button inside the password field)
    const toggleButtons = screen.getAllByRole("button");
    const eyeToggle = toggleButtons.find(
      (btn) =>
        btn.closest(".relative") &&
        passwordInput.closest(".relative") === btn.closest(".relative"),
    );

    if (eyeToggle) {
      await user.click(eyeToggle);
      expect(passwordInput).toHaveAttribute("type", "text");
    }
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, "not-an-email");

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it("calls authClient.signIn.email on successful submission", async () => {
    const user = userEvent.setup();
    mockSignInEmail.mockResolvedValue({
      data: { user: { redirectUrl: "/dashboard" } },
      error: null,
    });

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        rememberMe: false,
      });
    });
  });

  it("redirects on successful login", async () => {
    const user = userEvent.setup();
    mockSignInEmail.mockResolvedValue({
      data: { user: { redirectUrl: "/dashboard" } },
      error: null,
    });

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error toast on login failure", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    mockSignInEmail.mockResolvedValue({
      data: null,
      error: { message: "Invalid credentials" },
    });

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    });
  });

  it("shows error toast on unexpected exception", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    mockSignInEmail.mockRejectedValue(new Error("Network error"));

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "An unexpected error occurred",
      );
    });
  });

  it("calls handleSocialAuth with google on Google button click", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /google/i }));

    expect(mockHandleSocialAuth).toHaveBeenCalledWith("google");
  });

  it("calls handleSocialAuth with linkedin on LinkedIn button click", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /linkedin/i }));

    expect(mockHandleSocialAuth).toHaveBeenCalledWith("linkedin");
  });
});
