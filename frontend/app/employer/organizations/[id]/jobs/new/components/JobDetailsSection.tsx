"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateJobFormApi } from "../hooks/use-create-job-form";

interface JobDetailsSectionProps {
  form: CreateJobFormApi;
}

export function JobDetailsSection({ form }: JobDetailsSectionProps) {
  return (
    <>
      {/* Job Type + Compensation Type */}
      <div className="grid gap-6 md:grid-cols-2">
        <form.Field
          name="jobType"
          children={(field) => (
            <div className="space-y-2">
              <Label>Job Type *</Label>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />

        <form.Field
          name="compensationType"
          children={(field) => (
            <div className="space-y-2">
              <Label>Compensation Type *</Label>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select compensation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="missionary">Missionary</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="stipend">Stipend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      {/* Remote + Deadline */}
      <div className="grid gap-6 md:grid-cols-2">
        <form.Field
          name="isRemote"
          children={(field) => (
            <div className="flex items-center space-x-3 pt-7">
              <Switch
                id={field.name}
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
              <Label htmlFor={field.name}>Remote position</Label>
            </div>
          )}
        />

        <form.Field
          name="applicationDeadline"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Application Deadline</Label>
              <Input
                id={field.name}
                type="date"
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value || null)
                }
              />
            </div>
          )}
        />
      </div>

      {/* Experience */}
      <form.Field
        name="experience"
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Experience</Label>
            <Input
              id={field.name}
              placeholder="e.g. 3-5 years"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />
    </>
  );
}
