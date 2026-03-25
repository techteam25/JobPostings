"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateWorkAvailability } from "@/lib/api";

interface ReadyToWorkFormProps {
  defaultAvailable: boolean;
}

export function ReadyToWorkForm({ defaultAvailable }: ReadyToWorkFormProps) {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      isAvailableForWork: defaultAvailable,
    },
    onSubmit: async ({ value }) => {
      const result = await updateWorkAvailability(value.isAvailableForWork);

      if (result.success) {
        toast.success("Work availability updated successfully");
      } else {
        toast.error(result.message);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="isAvailableForWork">
        {(field) => (
          <div className="flex items-center gap-3 py-4">
            <Switch
              className="data-[state=checked]:bg-primary"
              id="available-for-work"
              checked={field.state.value}
              onCheckedChange={(checked) => field.handleChange(checked)}
            />
            <Label
              htmlFor="available-for-work"
              className="text-foreground text-base font-normal"
            >
              I&apos;m available to start immediately
            </Label>
          </div>
        )}
      </form.Field>

      <div className="flex items-center gap-3 pt-6">
        <form.Subscribe selector={(state) => state.canSubmit}>
          {(canSubmit) => (
            <Button
              type="submit"
              className="cursor-pointer px-8"
              disabled={!canSubmit}
            >
              Save
            </Button>
          )}
        </form.Subscribe>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer px-6"
          onClick={() => router.push("/me/profile")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
