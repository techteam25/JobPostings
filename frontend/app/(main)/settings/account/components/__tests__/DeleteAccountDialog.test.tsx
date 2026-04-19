import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DeleteAccountDialog from "../DeleteAccountDialog";

const deleteUserMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  authClient: {
    deleteUser: (...args: unknown[]) => deleteUserMock(...args),
  },
}));

vi.mock("@/env", () => ({
  env: { NEXT_PUBLIC_FRONTEND_URL: "http://localhost:3000" },
}));

const toastErrorMock = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

describe("DeleteAccountDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders seeker-specific bullet list for seekers", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountDialog email="seeker@test.com" intent="seeker" />);

    await user.click(screen.getByRole("button", { name: /delete account/i }));

    expect(
      screen.getByText(/your profile, resume, and qualifications/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/your job applications/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/membership in organizations/i),
    ).not.toBeInTheDocument();
  });

  it("renders employer-specific bullet list and sole-owner notice for employers", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountDialog email="employer@test.com" intent="employer" />);

    await user.click(screen.getByRole("button", { name: /delete account/i }));

    expect(
      screen.getByText(/membership in organizations you belong to/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/transfer ownership or delete the organization first/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/your job applications/i),
    ).not.toBeInTheDocument();
  });

  it("keeps submit disabled until the typed email matches", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountDialog email="match@test.com" intent="seeker" />);

    await user.click(screen.getByRole("button", { name: /delete account/i }));

    const submits = screen.getAllByRole("button", { name: /delete account/i });
    const dialogSubmit = submits[submits.length - 1]!;

    expect(dialogSubmit).toBeDisabled();

    const input = screen.getByLabelText(/type.*to confirm/i);
    await user.type(input, "wrong@test.com");
    expect(dialogSubmit).toBeDisabled();

    await user.clear(input);
    await user.type(input, "match@test.com");
    expect(dialogSubmit).toBeEnabled();
  });

  it("calls authClient.deleteUser with the expected callback URL and swaps to sent view", async () => {
    deleteUserMock.mockResolvedValue({ data: {}, error: null });
    const user = userEvent.setup();
    render(<DeleteAccountDialog email="user@test.com" intent="seeker" />);

    await user.click(screen.getByRole("button", { name: /delete account/i }));
    const input = screen.getByLabelText(/type.*to confirm/i);
    await user.type(input, "user@test.com");

    const submits = screen.getAllByRole("button", { name: /delete account/i });
    await user.click(submits[submits.length - 1]!);

    expect(deleteUserMock).toHaveBeenCalledWith({
      callbackURL: "http://localhost:3000/account-deleted",
    });
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    expect(screen.getByText(/expires in one hour/i)).toBeInTheDocument();
  });

  it("shows the blocked view with deep links when the backend returns sole-owner orgs", async () => {
    deleteUserMock.mockResolvedValue({
      data: null,
      error: {
        message: "You own organizations",
        details: {
          orgs: [
            { id: 101, name: "Acme Missions" },
            { id: 202, name: "Beacon Outreach" },
          ],
        },
      },
    });
    const user = userEvent.setup();
    render(<DeleteAccountDialog email="owner@test.com" intent="employer" />);

    await user.click(screen.getByRole("button", { name: /delete account/i }));
    await user.type(
      screen.getByLabelText(/type.*to confirm/i),
      "owner@test.com",
    );
    const submits = screen.getAllByRole("button", { name: /delete account/i });
    await user.click(submits[submits.length - 1]!);

    expect(
      await screen.findByText(/transfer or delete your organizations first/i),
    ).toBeInTheDocument();

    const acmeLink = screen.getByRole("link", { name: /acme missions/i });
    expect(acmeLink).toHaveAttribute(
      "href",
      "/employer/organizations/101/settings/edit",
    );
    const beaconLink = screen.getByRole("link", { name: /beacon outreach/i });
    expect(beaconLink).toHaveAttribute(
      "href",
      "/employer/organizations/202/settings/edit",
    );
  });

  it("toasts a generic error for non-blocking failures and returns to the form", async () => {
    deleteUserMock.mockResolvedValue({
      data: null,
      error: { message: "Something exploded" },
    });
    const user = userEvent.setup();
    render(<DeleteAccountDialog email="user@test.com" intent="seeker" />);

    await user.click(screen.getByRole("button", { name: /delete account/i }));
    await user.type(
      screen.getByLabelText(/type.*to confirm/i),
      "user@test.com",
    );
    const submits = screen.getAllByRole("button", { name: /delete account/i });
    await user.click(submits[submits.length - 1]!);

    expect(toastErrorMock).toHaveBeenCalledWith("Something exploded");
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
  });
});
