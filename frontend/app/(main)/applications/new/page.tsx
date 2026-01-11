import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Briefcase,
  User,
  FileText,
  Send,
} from "lucide-react";

export default function JobApplicationFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    currentTitle: "",
    yearsExperience: "",
    linkedIn: "",
    portfolio: "",
    coverLetter: "",
    startDate: "",
    salary: "",
    referral: "",
    resume: null,
    additionalDocs: null,
  });

  const totalSteps = 4;

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      updateField(field, file);
    }
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    alert("Application submitted successfully!");
  };

  const stepConfig = [
    { num: 1, icon: User, title: "Personal Info" },
    { num: 2, icon: Briefcase, title: "Professional" },
    { num: 3, icon: FileText, title: "Details" },
    { num: 4, icon: Upload, title: "Documents" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Apply for Senior Product Designer
          </h1>
          <p className="text-gray-600">
            TechCorp Inc. • San Francisco, CA • Full-time
          </p>
        </div>

        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            {stepConfig.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isCompleted = step > s.num;

              return (
                <React.Fragment key={s.num}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                            ? "scale-110 bg-blue-600 text-white shadow-lg"
                            : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${isActive ? "text-blue-600" : "text-gray-500"}`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {idx < stepConfig.length - 1 && (
                    <div
                      className={`mx-2 h-1 flex-1 rounded transition-all duration-300 ${
                        step > s.num ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-8 shadow-xl">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-1 text-2xl font-bold text-gray-900">
                  Personal Information
                </h2>
                <p className="text-sm text-gray-500">
                  Let's start with the basics
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-1 text-2xl font-bold text-gray-900">
                  Professional Background
                </h2>
                <p className="text-sm text-gray-500">
                  Tell us about your experience
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Current/Most Recent Job Title *
                </label>
                <input
                  type="text"
                  value={formData.currentTitle}
                  onChange={(e) => updateField("currentTitle", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="Senior UX Designer"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Years of Experience *
                </label>
                <select
                  value={formData.yearsExperience}
                  onChange={(e) =>
                    updateField("yearsExperience", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select experience level</option>
                  <option value="0-2">0-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={formData.linkedIn}
                  onChange={(e) => updateField("linkedIn", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Portfolio/Website
                </label>
                <input
                  type="url"
                  value={formData.portfolio}
                  onChange={(e) => updateField("portfolio", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="yourportfolio.com"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-1 text-2xl font-bold text-gray-900">
                  Application Details
                </h2>
                <p className="text-sm text-gray-500">
                  A few more things we'd like to know
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Why are you interested in this position?
                </label>
                <textarea
                  value={formData.coverLetter}
                  onChange={(e) => updateField("coverLetter", e.target.value)}
                  rows="6"
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="Share what excites you about this opportunity..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Earliest Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateField("startDate", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Expected Salary
                  </label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => updateField("salary", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="$120,000"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  How did you hear about us?
                </label>
                <select
                  value={formData.referral}
                  onChange={(e) => updateField("referral", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an option</option>
                  <option value="job-board">Job Board</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="referral">Employee Referral</option>
                  <option value="company-website">Company Website</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-1 text-2xl font-bold text-gray-900">
                  Upload Documents
                </h2>
                <p className="text-sm text-gray-500">
                  Share your resume and any additional materials
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Resume/CV *
                </label>
                <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-all hover:border-blue-500">
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload("resume", e)}
                    className="hidden"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <Upload className="mx-auto mb-3 text-gray-400" size={32} />
                    {formData.resume ? (
                      <p className="text-sm font-medium text-green-600">
                        {formData.resume.name}
                      </p>
                    ) : (
                      <>
                        <p className="mb-1 text-sm text-gray-600">
                          <span className="font-medium text-blue-600">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, or DOCX (max 10MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Additional Documents (Optional)
                </label>
                <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-all hover:border-blue-500">
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload("additionalDocs", e)}
                    className="hidden"
                    id="additional-upload"
                    accept=".pdf,.doc,.docx"
                    multiple
                  />
                  <label htmlFor="additional-upload" className="cursor-pointer">
                    <FileText
                      className="mx-auto mb-3 text-gray-400"
                      size={32}
                    />
                    {formData.additionalDocs ? (
                      <p className="text-sm font-medium text-green-600">
                        {formData.additionalDocs.name}
                      </p>
                    ) : (
                      <>
                        <p className="mb-1 text-sm text-gray-600">
                          <span className="font-medium text-blue-600">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          Cover letter, portfolio, certifications, etc.
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-medium text-blue-900">
                  Review Your Application
                </h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>✓ Personal information complete</p>
                  <p>✓ Professional background added</p>
                  <p>✓ Application details provided</p>
                  <p
                    className={
                      formData.resume ? "text-green-700" : "text-blue-800"
                    }
                  >
                    {formData.resume ? "✓" : "○"} Resume uploaded
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
            <button
              onClick={prevStep}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-all ${
                step === 1
                  ? "invisible"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              disabled={step === 1}
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            {step < totalSteps ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700"
              >
                Next Step
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white shadow-lg shadow-green-500/30 transition-all hover:bg-green-700"
              >
                <Send size={20} />
                Submit Application
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500">
          By submitting this application, you agree to our Terms of Service and
          Privacy Policy
        </p>
      </div>
    </div>
  );
}
