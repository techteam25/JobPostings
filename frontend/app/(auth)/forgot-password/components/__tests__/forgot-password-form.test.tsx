import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import ForgotPasswordForm from "../forgot-password-form";

const mockRequestPasswordReset = vi.fn();

vi.mock("next/image", () => ({
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element, @typescript-eslint/no-explicit-any
  default: (props: any) => <img {...props} />,
}));

vi.mock("@/lib/auth", () => ({
  authClient: {
    requestPasswordReset: (...args: unknown[]) =>
      mockRequestPasswordReset(...args),
  },
}));

vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_FRONTEND_URL: "http://localhost:3000",
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email input and submit button", () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send reset link/i }),
    ).toBeInTheDocument();
  });

  it("renders link back to sign-in", () => {
    render(<ForgotPasswordForm />);

    expect(
      screen.getByRole("link", { name: /back to sign in/i }),
    ).toHaveAttribute("href", "/sign-in");
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, "not-an-email");

    await waitFor(() => {
      expect(
        screen.getByText(/please enter a valid email/i),
      ).toBeInTheDocument();
    });
  });

  it("calls authClient.requestPasswordReset on submission", async () => {
    const user = userEvent.setup();
    mockRequestPasswordReset.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({
        email: "test@example.com",
        redirectTo: "http://localhost:3000/reset-password",
      });
    });
  });

  it("shows generic success message after submission", async () => {
    const user = userEvent.setup();
    mockRequestPasswordReset.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/if an account exists/i)).toBeInTheDocument();
    });
  });

  it("shows error toast on network failure", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    mockRequestPasswordReset.mockRejectedValue(new Error("Network error"));

    render(<ForgotPasswordForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("An unexpected error occurred");
    });
  });
});
