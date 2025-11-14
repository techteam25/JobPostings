"use client";

import { useState } from "react";
import {
  Upload,
  Copy,
  X,
  Settings,
  Home,
  BarChart3,
  Calendar,
  HelpCircle,
  MessageSquare,
} from "lucide-react";

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topics, setTopics] = useState([
    "Digital agency",
    "Conversion-focused call-to-action placement",
    "User-friendly interfaces",
    "Design interfaces",
  ]);
  const [audiences, setAudiences] = useState([
    "Call-action placement",
    "User-friendly interfaces",
    "Websites",
    "Digital agency",
    "User-friendly interfaces",
  ]);

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const removeAudience = (index: number) => {
    setAudiences(audiences.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center gap-2 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500">
            <div className="h-5 w-5 rounded bg-white"></div>
          </div>
          <span className="text-lg font-bold">
            Social<span className="text-teal-500">Hub</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            <Home size={20} />
            <span>Home</span>
          </a>

          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            <BarChart3 size={20} />
            <span>Analytics</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            <Calendar size={20} />
            <span>Calendar</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg bg-teal-500 px-3 py-2 text-white"
          >
            <Settings size={20} />
            <span>Settings</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            <HelpCircle size={20} />
            <span>Help</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            <MessageSquare size={20} />
            <span>Feedback</span>
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="mb-6 text-2xl font-bold">Company Settings</h1>

          {/* Tabs */}
          <div className="mb-6 flex gap-6 border-b border-gray-200">
            <button className="border-b-2 border-teal-500 pb-3 font-medium text-teal-600">
              Company
            </button>
            <button className="pb-3 text-gray-600 hover:text-gray-900">
              Members
            </button>
            <button className="pb-3 text-gray-600 hover:text-gray-900">
              Jobs
            </button>
            <button className="pb-3 text-gray-600 hover:text-gray-900">
              Advanced
            </button>
          </div>

          {/* Form Fields */}
          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Company Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter the name..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                <Copy
                  className="absolute top-2.5 right-3 text-gray-400"
                  size={20}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Company Website
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter the website..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
                <Copy
                  className="absolute top-2.5 right-3 text-gray-400"
                  size={20}
                />
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Company Type
              </label>
              <select className="w-full rounded-lg border border-gray-300 px-4 py-2">
                <option>Enter the company type...</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Language</label>
              <select className="w-full rounded-lg border border-gray-300 px-4 py-2">
                <option>English (US)</option>
              </select>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Communication Style
              </label>
              <select className="w-full rounded-lg border border-gray-300 px-4 py-2">
                <option>Friendly</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Audience ages
              </label>
              <select className="w-full rounded-lg border border-gray-300 px-4 py-2">
                <option>Select...</option>
              </select>
            </div>
          </div>
          <div className="mb-6 grid gap-6">
            {/* Upload Logo */}
            <div>
              <h3 className="mb-3 font-semibold">Upload Your Logo</h3>
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-600">
                  Click to upload your logo
                </p>
                <p className="text-xs text-gray-400">
                  It must be a PNG, JPG or JPEG file
                </p>
              </div>
            </div>
          </div>

          {/* Topics */}
          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium">Topics</label>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-sm"
                  >
                    {topic}
                    <button
                      onClick={() => removeTopic(index)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <button className="rounded-full bg-teal-500 px-3 py-1 text-sm text-white">
                  + Add a topic
                </button>
              </div>
            </div>

            {/* Audiences */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Audiences
              </label>
              <div className="flex flex-wrap gap-2">
                {audiences.map((audience, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-sm"
                  >
                    {audience}
                    <button
                      onClick={() => removeAudience(index)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <button className="rounded-full bg-teal-500 px-3 py-1 text-sm text-white">
                  + Add audience
                </button>
              </div>
            </div>
          </div>

          {/* Company Description */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Company Description
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
              rows={3}
              defaultValue="Follow is a social media management tool that uses AI to assist with scheduling, content creation, and analytics. It offers users the ability to optimize their social media strategies, create engaging content with the help of AI, and track analytics to inform decisions."
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50">
              Cancel
            </button>
            <button className="rounded-lg bg-teal-500 px-6 py-2 text-white hover:bg-teal-600">
              Update
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
