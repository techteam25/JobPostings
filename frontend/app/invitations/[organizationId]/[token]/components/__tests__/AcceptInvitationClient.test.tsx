import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { env } from "@/test/mocks/env";
import { AcceptInvitationClient } from "../AcceptInvitationClient";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const organizationId = 42;
const token = "invite-token-abc";

const invitation = {
  organizationName: "Acme Missions",
  role: "member",
  inviterName: "Jane Doe",
  expiresAt: "2026-09-15T00:00:00.000Z",
};

describe("AcceptInvitationClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows org, role, and expiry from the API response", () => {
    render(
      <AcceptInvitationClient
        organizationId={organizationId}
        token={token}
        invitation={invitation}
      />,
    );

    expect(screen.getByText(/Acme Missions/)).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Expires:/)).toBeInTheDocument();
  });

  it("accepts invitation via the live accept API contract", async () => {
    const user = userEvent.setup();
    let acceptCalled = false;

    server.use(
      http.post(
        `${env.NEXT_PUBLIC_SERVER_URL}/invitations/${organizationId}/${token}/accept`,
        () => {
          acceptCalled = true;
          return HttpResponse.json({
            success: true,
            message: "Invitation accepted successfully",
            data: { message: "Invitation accepted successfully" },
            timestamp: new Date().toISOString(),
          });
        },
      ),
    );

    render(
      <AcceptInvitationClient
        organizationId={organizationId}
        token={token}
        invitation={invitation}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /accept invitation/i }),
    );

    await waitFor(() => {
      expect(acceptCalled).toBe(true);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        `/employer/organizations/${organizationId}`,
      );
    });
  });

  it("shows an error when accept fails for a stale token", async () => {
    const user = userEvent.setup();
    const { toast } = await import("sonner");

    server.use(
      http.post(
        `${env.NEXT_PUBLIC_SERVER_URL}/invitations/${organizationId}/${token}/accept`,
        () =>
          HttpResponse.json(
            {
              success: false,
              message: "This invitation has been cancelled",
              errorCode: "VALIDATION_ERROR",
            },
            { status: 400 },
          ),
      ),
    );

    render(
      <AcceptInvitationClient
        organizationId={organizationId}
        token={token}
        invitation={invitation}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /accept invitation/i }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "This invitation has been cancelled",
      );
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
