import { getInvitationDetails } from "@/lib/api";
import { AcceptInvitationClient } from "./components/AcceptInvitationClient";

interface PageProps {
  params: Promise<{ organizationId: string; token: string }>;
}

export default async function InvitationPage({ params }: PageProps) {
  const { organizationId, token } = await params;
  const response = await getInvitationDetails(organizationId, token);

  if (!response.success || !response.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Invalid Invitation
          </h1>
          <p className="text-gray-600">
            {response.message ||
              "This invitation link is invalid or has expired."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AcceptInvitationClient
      organizationId={Number(organizationId)}
      token={token}
      invitation={response.data}
    />
  );
}
