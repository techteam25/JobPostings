import { Clock, DollarSign, MapPin } from "lucide-react";

export const JobContextSidebar = () => {
  return (
    <div className="hidden lg:col-span-4 lg:block">
      <div className="sticky top-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-xl font-bold text-white">
            T
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">
            Senior Product Designer
          </h1>
          <p className="mb-6 font-medium text-slate-500">TechCorp Inc.</p>

          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <MapPin size={18} className="text-slate-400" />
              San Francisco, CA (Hybrid)
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <DollarSign size={18} className="text-slate-400" />
              $140k - $180k / year
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Clock size={18} className="text-slate-400" />
              Full-time
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="mb-2 text-sm font-bold text-slate-900">
              Role Overview
            </h3>
            <p className="text-sm leading-relaxed text-slate-500">
              We're looking for a Senior Product Designer to lead our core
              product initiatives. You'll work directly with engineering and
              product to ship high-impact features.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="mb-1 font-semibold">💡 Application Tip</p>
          <p>
            Include a link to your live portfolio. We love seeing case studies!
          </p>
        </div>
      </div>
    </div>
  );
};
