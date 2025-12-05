"use client";
import { useActionState } from "react";
import { updateOrganization } from "@/lib/api";

import { Copy, Loader2, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Organization } from "@/lib/types";

interface CompanyInformationProps {
  organization: Organization;
}

const CompanyInformation = ({ organization }: CompanyInformationProps) => {
  const [state, action, pending] = useActionState(
    updateOrganization,
    organization,
  );
  return (
    <div className="flex h-full w-full flex-col p-8">
      <form action={action}>
        {/* Form Fields */}
        <div className="mb-6 grid grid-cols-2 gap-6">
          <div>
            <Label className="mb-2 block text-sm font-medium">
              Company Name
            </Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter the name..."
                className="border-border w-full rounded-lg border px-4 py-2"
                defaultValue={state?.name || ""}
              />
              <Copy
                className="text-muted-foreground absolute top-2.5 right-3"
                size={20}
              />
            </div>
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">
              Company Website
            </Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter the website..."
                className="border-border w-full rounded-lg border px-4 py-2"
                defaultValue={state?.url || ""}
              />
              <Copy
                className="text-muted-foreground absolute top-2.5 right-3"
                size={20}
              />
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-6">
          <div>
            <Label className="mb-2 block text-sm font-medium">City</Label>
            <Input
              type="text"
              placeholder="Enter the website..."
              className="border-border w-full rounded-lg border px-4 py-2"
              defaultValue={state?.city || ""}
            />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Country</Label>
            <Input
              type="text"
              placeholder="Enter the website..."
              className="border-border w-full rounded-lg border px-4 py-2"
              defaultValue={state?.country || ""}
            />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-6">
          <div>
            <Label className="mb-2 block text-sm font-medium">Address</Label>
            <Input
              type="text"
              placeholder="Enter the website..."
              className="border-border w-full rounded-lg border px-4 py-2"
              defaultValue={state?.streetAddress || ""}
            />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">State</Label>
            <Input
              type="text"
              placeholder="Enter the website..."
              className="border-border w-full rounded-lg border px-4 py-2"
              defaultValue={state?.state || ""}
            />
          </div>
        </div>
        <div className="mb-6 grid gap-6">
          {/* Upload Logo */}
          <div>
            <h3 className="mb-3 font-semibold">Upload Your Logo</h3>
            <div className="border-border bg-background rounded-lg border-2 border-dashed p-12 text-center">
              <Upload
                className="text-muted-foreground mx-auto mb-2"
                size={32}
              />
              <p className="text-secondary-foreground text-sm">
                Click to upload your logo
              </p>
              <p className="text-muted-foreground text-xs">
                It must be a PNG, JPG or JPEG file
              </p>
            </div>
          </div>
        </div>

        {/* Company Description */}
        <div className="mb-6">
          <Label className="mb-2 block text-sm font-medium">
            Company Mission
          </Label>
          <div
            dangerouslySetInnerHTML={{
              __html: state?.mission || "",
            }}
            className="border-border min-h-[120px] w-full overflow-y-auto rounded-lg border px-4 py-2"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            disabled={pending}
            variant="ghost"
            className="hover:text-foreground border-border hover:bg-secondary cursor-pointer rounded-lg border px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            className="bg-primary/90 hover:bg-primary text-primary-foreground cursor-pointer rounded-lg px-6 py-2"
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CompanyInformation;
