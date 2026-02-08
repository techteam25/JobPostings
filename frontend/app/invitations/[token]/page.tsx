import { getInvitationDetails } from "@/lib/api";
import { AcceptInvitationClient } from "./components/AcceptInvitationClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: PageProps) {
  const { token } = await params;

  try {
    const response = await getInvitationDetails(token);

    if (!response.success || !response.data) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Invalid Invitation
            </h1>
            <p className="text-gray-600">
              This invitation link is invalid or has expired.
            </p>
          </div>
        </div>
      );
    }

    return (
      <AcceptInvitationClient
        token={token}
        invitation={response.data}
      />
    );
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Invitation Not Found
          </h1>
          <p className="text-gray-600">
            This invitation link is invalid, has expired, or has already been
            used.
          </p>
        </div>
      </div>
    );
  }
}
