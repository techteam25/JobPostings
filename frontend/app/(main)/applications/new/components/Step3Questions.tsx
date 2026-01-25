"use client";

import { Label } from "@/components/ui/label";
import { useApplicationForm } from "../hooks/use-application-form";

export const Step3Questions = () => {
  const { formData, setFormData } = useApplicationForm();

  return (
    <div className="animate-in fade-in slide-in-from-right-8 space-y-6 duration-500">
      <h2 className="text-xl font-bold text-slate-900">A few last questions</h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Why do you want to join the Product Design team at TechCorp?
          </Label>
          <textarea
            className="min-h-[120px] w-full resize-y rounded-lg border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
            placeholder="Tell us about your motivation..."
            value={formData.q1}
            onChange={(e) => setFormData({ ...formData, q1: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Are you authorized to work in the United States?
          </Label>
          <div className="flex gap-4">
            <Label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border p-3 hover:bg-slate-50">
              <input
                type="radio"
                name="auth"
                className="text-blue-600 focus:ring-blue-500"
                value="yes"
                checked={formData.q2 === "yes"}
                onChange={(e) =>
                  setFormData({ ...formData, q2: e.target.value })
                }
              />
              <span className="text-sm">Yes, I am authorized</span>
            </Label>
            <Label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border p-3 hover:bg-slate-50">
              <input
                type="radio"
                name="auth"
                className="text-blue-600 focus:ring-blue-500"
                value="no"
                checked={formData.q2 === "no"}
                onChange={(e) =>
                  setFormData({ ...formData, q2: e.target.value })
                }
              />
              <span className="text-sm">No, I require sponsorship</span>
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};
