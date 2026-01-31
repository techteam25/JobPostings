import { Users, Briefcase, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsBarProps {
  total: number;
  active: number;
  interviewing: number;
  hired: number;
}

export const ApplicationsStatsBar = ({
  total,
  active,
  interviewing,
  hired,
}: StatsBarProps) => {
  const stats = [
    {
      label: "Total Applications",
      value: total,
      icon: Users,
    },
    {
      label: "Active",
      value: active,
      icon: Briefcase,
    },
    {
      label: "Interviewing",
      value: interviewing,
      icon: Clock,
    },
    {
      label: "Hired",
      value: hired,
      icon: CheckCircle2,
    },
  ];

  return (
    <Card className="mb-8 border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100">
                <stat.icon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
