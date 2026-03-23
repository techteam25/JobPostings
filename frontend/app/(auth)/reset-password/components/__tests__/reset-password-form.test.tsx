import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import ResetPasswordForm from "../reset-password-form";

const mockReplace = vi.fn();
const mockResetPassword = vi.fn();
const mockSearchParams = vi.fn(
  () => new URLSearchParams("token=test-token-123"),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams(),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element, @typescript-eslint/no-explicit-any
  default: (props: any) => <img {...props} />,
}));

vi.mock("@/lib/auth", () => ({
  authClient: {
    resetPassword: (...args: unknown[]) => mockResetPassword(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ResetPasswordForm with valid token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(
      new URLSearchParams("token=test-token-123"),
    );
  });

  it("renders password fields and submit button when token is present", () => {
    render(<ResetPasswordForm />);

    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reset password/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText(/^new password$/i), "short");

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it("shows validation error when passwords don't match", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(
      screen.getByLabelText(/^new password$/i),
      "NewPassword@123",
    );
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      "DifferentPassword@123",
    );

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("calls authClient.resetPassword on successful submission", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({ error: null });

    render(<ResetPasswordForm />);

    await user.type(
      screen.getByLabelText(/^new password$/i),
      "NewPassword@123",
    );
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      "NewPassword@123",
    );
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        newPassword: "NewPassword@123",
        token: "test-token-123",
      });
    });
  });

  it("redirects to sign-in on success", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({ error: null });

    render(<ResetPasswordForm />);

    await user.type(
      screen.getByLabelText(/^new password$/i),
      "NewPassword@123",
    );
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      "NewPassword@123",
    );
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Password reset successfully");
      expect(mockReplace).toHaveBeenCalledWith("/sign-in");
    });
  });

  it("shows error toast on failure", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({
      error: { message: "Invalid token" },
    });

    render(<ResetPasswordForm />);

    await user.type(
      screen.getByLabelText(/^new password$/i),
      "NewPassword@123",
    );
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      "NewPassword@123",
    );
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid token");
    });
  });
});

describe("ResetPasswordForm with no token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams(""));
  });

  it("shows error state when no token is provided", () => {
    render(<ResetPasswordForm />);

    expect(
      screen.getByText(/link has expired or is invalid/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /request a new link/i }),
    ).toHaveAttribute("href", "/forgot-password");
  });
});
