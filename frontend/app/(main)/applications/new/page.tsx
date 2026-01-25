import {
  ApplicationFooter,
  ApplicationHeader,
  JobContextSidebar,
} from "./components";
import { MainContent } from "@/app/(main)/applications/new/components/MainContent";

export default function ApplyForJob() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans md:p-8">
      <div className="mx-auto max-w-6xl">
        <ApplicationHeader />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <JobContextSidebar />

          {/* RIGHT COLUMN: Application Flow */}
          <div className="lg:col-span-8">
            <div className="flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
              {/* Main Content Area */}
              <MainContent />
              <ApplicationFooter />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
