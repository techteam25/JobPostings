"use client";

import { CheckCircle2, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApplicationForm } from "../hooks/use-application-form";

export const Step2Details = () => {
  const { formData, setFormData, setStep } = useApplicationForm();

  return (
    <div className="animate-in fade-in slide-in-from-right-8 space-y-6 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Contact Info</h2>
        <button
          onClick={() => setStep(1)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Replace Resume
        </button>
      </div>

      {/* Resume File Badge */}
      {formData.resume && (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {formData.resume.name}
              </p>
              <p className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 size={12} /> Parsed successfully
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFormData({ ...formData, resume: null })}
          >
            <X size={16} />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="id-first-name">FirstName</Label>
          <Input
            id="id-first-name"
            placeholder="Enter your firstname"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="id-last-name">Last Name</Label>
          <Input
            id="id-last-name"
            placeholder="Enter your lastname"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
          />
        </div>
      </div>

      <div>
        <Label htmlFor="id-email">Email</Label>
        <Input
          id="id-email"
          placeholder="you@example.com"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="id-phone">Phone</Label>
        <Input
          id="id-phone"
          placeholder="(123) 456-7890"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Online Presence
        </h2>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="id-linkedin">LinkedIn</Label>
            <Input
              id="id-linkedin"
              placeholder="linkedin.com/in/..."
              value={formData.linkedIn}
              onChange={(e) =>
                setFormData({ ...formData, linkedIn: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="id-website">Portfolio / Website</Label>
            <Input
              id="id-website"
              placeholder="myportfolio.com"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
