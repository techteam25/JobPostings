"use client";

import { FileText, Sparkles, UploadCloud } from "lucide-react";
import { BsLinkedin as Linkedin } from "react-icons/bs";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import { useApplicationStore } from "@/context/store";

export const Step1Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const { setStep, formData, setFormData } = useApplicationStore();

  const form = useForm({
    defaultValues: {
      resume: formData.resume,
    },
    onSubmit: async ({ value }) => {
      if (value.resume) {
        setFormData({ resume: value.resume });
      }
      setStep(2);
    },
  });

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsParsing(true);
    // Simulate parsing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setFormData({ resume: file });
    setIsParsing(false);
    setStep(2);
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
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
      <div className="mb-8 space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Let's start with your profile
        </h2>
        <p className="text-slate-500">
          Import your details to skip the manual entry.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button className="flex items-center justify-center gap-2 rounded-xl border border-[#0077b5] bg-[#0077b5]/5 p-4 font-semibold text-[#0077b5] transition-colors hover:bg-[#0077b5]/10">
          <Linkedin size={20} />
          Apply with LinkedIn
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 font-semibold text-slate-700 transition-colors hover:bg-slate-50">
          <FileText size={20} />
          Apply with Indeed
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">Or upload resume</span>
        </div>
      </div>

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
          accept=".pdf"
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          onChange={handleFileChange}
        />

        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
          {isParsing ? (
            <Sparkles className="animate-pulse" size={40} />
          ) : (
            <UploadCloud size={40} />
          )}
        </div>

        <div className="mt-4 space-y-1 text-center">
          <p className="text-lg font-semibold text-slate-900">
            {isParsing ? "Parsing resume..." : "Click or drag to upload resume"}
          </p>
          <p className="text-sm text-slate-500">PDF only (max. 5MB)</p>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => setStep(2)}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};
