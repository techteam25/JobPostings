import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@/test/test-utils";
import { server } from "@/test/mocks/server";
import { env } from "@/test/mocks/env";
import { PendingInvitationsSection } from "../PendingInvitationsSection";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const organizationId = 10;

const pendingInvitations = [
  {
    id: 42,
    email: "pending@example.com",
    role: "member",
    expiresAt: "2026-09-15T00:00:00.000Z",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
];

function mockPendingInvitationsResponse() {
  server.use(
    http.get(
      `${env.NEXT_PUBLIC_SERVER_URL}/organizations/${organizationId}/invitations`,
      () =>
        HttpResponse.json({
          success: true,
          message: "Pending invitations retrieved successfully",
          data: pendingInvitations,
          timestamp: new Date().toISOString(),
        }),
    ),
  );
}

describe("PendingInvitationsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists pending invitations in the members area", async () => {
    mockPendingInvitationsResponse();

    render(
      <PendingInvitationsSection
        organizationId={organizationId}
        canManageInvitations
      />,
    );

    expect(await screen.findByText("pending@example.com")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
  });

  it("cancels a pending invitation from the members area", async () => {
    mockPendingInvitationsResponse();
    const user = userEvent.setup();
    let cancelCalled = false;

    server.use(
      http.delete(
        `${env.NEXT_PUBLIC_SERVER_URL}/organizations/${organizationId}/invitations/42`,
        () => {
          cancelCalled = true;
          return HttpResponse.json({
            success: true,
            message: "Invitation cancelled successfully",
            data: { message: "Invitation cancelled successfully" },
            timestamp: new Date().toISOString(),
          });
        },
      ),
      http.get(
        `${env.NEXT_PUBLIC_SERVER_URL}/organizations/${organizationId}/invitations`,
        () =>
          HttpResponse.json({
            success: true,
            message: "Pending invitations retrieved successfully",
            data: cancelCalled ? [] : pendingInvitations,
            timestamp: new Date().toISOString(),
          }),
      ),
    );

    render(
      <PendingInvitationsSection
        organizationId={organizationId}
        canManageInvitations
      />,
    );

    await screen.findByText("pending@example.com");
    await user.click(
      screen.getByRole("button", {
        name: /cancel invitation for pending@example.com/i,
      }),
    );
    await user.click(
      screen.getByRole("button", { name: /^cancel invitation$/i }),
    );

    await waitFor(() => {
      expect(cancelCalled).toBe(true);
    });
    await waitFor(() => {
      expect(screen.queryByText("pending@example.com")).not.toBeInTheDocument();
    });
  });

  it("does not show pending invitations without invite-admin permission", async () => {
    mockPendingInvitationsResponse();

    render(
      <PendingInvitationsSection
        organizationId={organizationId}
        canManageInvitations={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("pending@example.com")).not.toBeInTheDocument();
    });
  });
});
