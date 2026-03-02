"use client";

import { FileText, UploadCloud, X, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { toast } from "sonner";
import { useApplicationStore } from "@/context/store";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const Step2CoverLetter = () => {
  const [isDragging, setIsDragging] = useState(false);
  const { setStep, formData, setFormData } = useApplicationStore();

  const handleFileUpload = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please upload a PDF, DOC, or DOCX file");
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setFormData({ coverLetter: file });
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 space-y-6 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">
          Upload Cover Letter{" "}
          <span className="text-sm font-normal text-slate-400">(Optional)</span>
        </h2>
        <p className="text-sm text-slate-500">
          A cover letter can help you stand out. Upload a PDF, DOC, or DOCX
          file.
        </p>
      </div>

      {formData.coverLetter ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {formData.coverLetter.name}
              </p>
              <p className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 size={12} /> Ready to submit
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFormData({ coverLetter: null })}
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <Input
            type="file"
            accept=".pdf,.doc,.docx"
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            onChange={handleFileChange}
          />

          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
            <UploadCloud size={40} />
          </div>

          <div className="mt-4 space-y-1 text-center">
            <p className="text-lg font-semibold text-slate-900">
              Click or drag to upload cover letter
            </p>
            <p className="text-sm text-slate-500">
              PDF, DOC, or DOCX (max. 5MB)
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={() => setStep(1)}>
          Back
        </Button>
        <div className="flex gap-3">
          {!formData.coverLetter && (
            <button
              onClick={() => setStep(3)}
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Skip
            </button>
          )}
          <Button onClick={() => setStep(3)} disabled={!formData.coverLetter}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
