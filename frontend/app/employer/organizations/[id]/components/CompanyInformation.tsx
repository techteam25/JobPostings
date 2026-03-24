"use client";

import { Copy } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Organization } from "@/lib/types";
import { toast } from "sonner";

interface CompanyInformationProps {
  organization: Organization;
}

const CompanyInformation = ({ organization }: CompanyInformationProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex h-full w-full flex-col p-8">
      {/* Info Fields */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label className="mb-2 block text-sm font-medium">Company Name</Label>
          <div className="relative">
            <p className="border-border bg-muted rounded-lg border px-4 py-2.5 pr-10 text-sm">
              {organization.name || "—"}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 size-8"
              onClick={() => copyToClipboard(organization.name || "")}
            >
              <Copy />
            </Button>
          </div>
        </div>
        <div>
          <Label className="mb-2 block text-sm font-medium">
            Company Website
          </Label>
          <div className="relative">
            <p className="border-border bg-muted rounded-lg border px-4 py-2.5 pr-10 text-sm">
              {organization.url || "—"}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 size-8"
              onClick={() => copyToClipboard(organization.url || "")}
            >
              <Copy />
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label className="mb-2 block text-sm font-medium">City</Label>
          <p className="border-border bg-muted rounded-lg border px-4 py-2.5 text-sm">
            {organization.city || "—"}
          </p>
        </div>
        <div>
          <Label className="mb-2 block text-sm font-medium">Country</Label>
          <p className="border-border bg-muted rounded-lg border px-4 py-2.5 text-sm">
            {organization.country || "—"}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label className="mb-2 block text-sm font-medium">Address</Label>
          <p className="border-border bg-muted rounded-lg border px-4 py-2.5 text-sm">
            {organization.streetAddress || "—"}
          </p>
        </div>
        <div>
          <Label className="mb-2 block text-sm font-medium">State</Label>
          <p className="border-border bg-muted rounded-lg border px-4 py-2.5 text-sm">
            {organization.state || "—"}
          </p>
        </div>
      </div>

      {/* Company Mission */}
      <div className="mb-6">
        <Label className="mb-2 block text-sm font-medium">
          Company Mission
        </Label>
        <div
          dangerouslySetInnerHTML={{
            __html: organization.mission || "",
          }}
          className="border-border bg-muted min-h-[120px] w-full overflow-y-auto rounded-lg border px-4 py-2"
        />
      </div>
    </div>
  );
};

export default CompanyInformation;
