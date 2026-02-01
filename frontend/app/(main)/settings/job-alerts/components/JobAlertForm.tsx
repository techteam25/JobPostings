"use client";

import { useForm } from "@tanstack/react-form";
import { jobAlertSchema, JobAlertFormData } from "@/schemas/job-alerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobAlert } from "@/lib/types";
import { toast } from "sonner";

interface JobAlertFormProps {
  initialData?: JobAlert;
  onSubmit: (data: JobAlertFormData) => void;
  isLoading?: boolean;
}

export function JobAlertForm({ initialData, onSubmit, isLoading }: JobAlertFormProps) {
  const form = useForm({
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      state: initialData?.state || "",
      city: initialData?.city || "",
      searchQuery: initialData?.searchQuery || "",
      jobType: initialData?.jobType || [],
      skills: initialData?.skills || [],
      experienceLevel: initialData?.experienceLevel || [],
      includeRemote: initialData?.includeRemote ?? true,
      frequency: initialData?.frequency || "weekly",
      isActive: initialData?.isActive ?? true,
      isPaused: initialData?.isPaused ?? false,
    } as JobAlertFormData,
    onSubmit: async ({ value }) => {
      const result = jobAlertSchema.safeParse(value);
      if (result.success) {
        onSubmit(result.data);
      } else {
        toast.error(result.error.issues[0]?.message || "Please check your form inputs");
      }
    },
  });

  const jobTypeOptions = [
    { value: "full_time", label: "Full-time" },
    { value: "part_time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "temporary", label: "Temporary" },
    { value: "intern", label: "Intern" },
  ];

  const experienceLevelOptions = [
    { value: "entry", label: "Entry Level" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior Level" },
    { value: "lead", label: "Lead" },
    { value: "executive", label: "Executive" },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field name="name" validators={{
        onChange: ({ value }) => {
          if (!value || value.length < 3) return "Name must be at least 3 characters";
          if (value.length > 100) return "Name must be at most 100 characters";
          return undefined;
        },
      }}>
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="name">Alert Name *</Label>
            <Input
              id="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="e.g., Frontend Developer in NYC"
            />
            {field.state.meta.errors && (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="description" validators={{
        onChange: ({ value }) => {
          if (!value || value.trim().length === 0) return "Description is required";
          return undefined;
        },
      }}>
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Describe what kind of jobs you're looking for"
              rows={3}
            />
            {field.state.meta.errors && (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="searchQuery">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="searchQuery">Keywords</Label>
            <Input
              id="searchQuery"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="e.g., React, TypeScript, Node.js"
            />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="city">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g., New York"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="state">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g., NY"
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="jobType">
        {(field) => (
          <div className="space-y-2">
            <Label>Job Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {jobTypeOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`jobType-${option.value}`}
                    checked={field.state.value?.includes(option.value as any)}
                    onCheckedChange={(checked) => {
                      const current = field.state.value || [];
                      if (checked) {
                        field.handleChange([...current, option.value] as any);
                      } else {
                        field.handleChange(current.filter((v) => v !== option.value) as any);
                      }
                    }}
                  />
                  <Label htmlFor={`jobType-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </form.Field>

      <form.Field name="experienceLevel">
        {(field) => (
          <div className="space-y-2">
            <Label>Experience Level</Label>
            <div className="grid grid-cols-2 gap-2">
              {experienceLevelOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`experience-${option.value}`}
                    checked={field.state.value?.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const current = field.state.value || [];
                      if (checked) {
                        field.handleChange([...current, option.value]);
                      } else {
                        field.handleChange(current.filter((v) => v !== option.value));
                      }
                    }}
                  />
                  <Label htmlFor={`experience-${option.value}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </form.Field>

      <form.Field name="skills">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              value={field.state.value?.join(", ") || ""}
              onChange={(e) => {
                const skills = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0);
                field.handleChange(skills);
              }}
              placeholder="e.g., JavaScript, Python, AWS"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="includeRemote">
        {(field) => (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeRemote"
              checked={field.state.value}
              onCheckedChange={(checked) => field.handleChange(!!checked)}
            />
            <Label htmlFor="includeRemote" className="font-normal cursor-pointer">
              Include remote positions
            </Label>
          </div>
        )}
      </form.Field>

      <form.Field name="frequency">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="frequency">Alert Frequency</Label>
            <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ canSubmit, isSubmitting }) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting || isLoading} className="w-full">
            {isLoading ? "Saving..." : initialData ? "Update Alert" : "Create Alert"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
