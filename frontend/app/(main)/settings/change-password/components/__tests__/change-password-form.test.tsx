import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import ChangePasswordForm from "../change-password-form";

vi.mock("@/lib/auth", () => ({
  authClient: { changePassword: vi.fn() },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("ChangePasswordForm", () => {
  it("waits until confirmation loses focus before showing a mismatch", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText(/^new password$/i), "StrongPass1!");
    const confirmation = screen.getByLabelText(/confirm new password/i);
    await user.type(confirmation, "Strong");
    expect(
      screen.queryByText(/passwords do not match/i),
    ).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();

    await user.click(confirmation);
    expect(
      screen.queryByText(/passwords do not match/i),
    ).not.toBeInTheDocument();
    await user.type(confirmation, "Pass1!");
    await user.tab();
    expect(
      screen.queryByText(/passwords do not match/i),
    ).not.toBeInTheDocument();
  });
});
