import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import VerifyEmailPage from "../page";

const sendVerificationEmail = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("email=test%40example.com"),
}));

vi.mock("@/lib/auth", () => ({
  authClient: {
    sendVerificationEmail: (...args: unknown[]) =>
      sendVerificationEmail(...args),
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("VerifyEmailPage", () => {
  beforeEach(() => sendVerificationEmail.mockReset());

  it("shows a returned resend error and keeps retry available", async () => {
    const { toast } = await import("sonner");
    sendVerificationEmail.mockResolvedValue({
      error: { message: "Email service unavailable" },
    });
    const user = userEvent.setup();
    render(<VerifyEmailPage />);

    const resend = screen.getByRole("button", {
      name: /resend verification email/i,
    });
    await user.click(resend);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Email service unavailable"),
    );
    expect(resend).toBeEnabled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("starts cooldown after a successful resend", async () => {
    const { toast } = await import("sonner");
    sendVerificationEmail.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<VerifyEmailPage />);

    await user.click(
      screen.getByRole("button", { name: /resend verification email/i }),
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Verification email sent!"),
    );
    expect(
      screen.getByRole("button", { name: /resend in 60s/i }),
    ).toBeDisabled();
  });
});
