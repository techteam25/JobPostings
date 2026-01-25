"use client";

import { FileText, Sparkles, UploadCloud } from "lucide-react";
import { BsLinkedin as Linkedin } from "react-icons/bs";
import { Input } from "@/components/ui/input";
import { useApplicationForm } from "../hooks/use-application-form";

export const Step1Upload = () => {
  const { isDragging, setIsDragging, isParsing, handleFileUpload } =
    useApplicationForm();

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
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
          <span className="bg-white px-2 font-medium text-slate-400">
            Or upload resume
          </span>
        </div>
      </div>

      <div
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          isDragging
            ? "scale-[1.02] border-blue-500 bg-blue-50"
            : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-blue-100 p-4 text-blue-600">
            <UploadCloud size={32} />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-sm text-slate-500">PDF, DOCX up to 10MB</p>
          </div>
          <Input
            type="file"
            className="hidden"
            id="resume-upload"
            onChange={handleFileChange}
            accept=".pdf,.docx"
          />
          <label
            htmlFor="resume-upload"
            className="absolute inset-0 cursor-pointer"
          />
        </div>
      </div>

      {isParsing && (
        <div className="flex animate-pulse items-center justify-center gap-2 rounded-lg bg-blue-50 p-3 text-blue-600">
          <Sparkles size={16} />
          <span className="text-sm font-medium">
            Analyzing resume & autofilling details...
          </span>
        </div>
      )}
    </div>
  );
};
