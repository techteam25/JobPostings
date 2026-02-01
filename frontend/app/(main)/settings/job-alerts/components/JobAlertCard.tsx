"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { JobAlert } from "@/lib/types";
import { Clock, MapPin, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface JobAlertCardProps {
  alert: JobAlert;
  onEdit: (alert: JobAlert) => void;
  onDelete: (alert: JobAlert) => void;
  onTogglePause: (alert: JobAlert, isPaused: boolean) => void;
  isPauseLoading?: boolean;
}

export function JobAlertCard({ alert, onEdit, onDelete, onTogglePause, isPauseLoading }: JobAlertCardProps) {
  const getStatusBadge = () => {
    if (!alert.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (alert.isPaused) {
      return <Badge variant="outline">Paused</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getCriteriaBadges = () => {
    const badges = [];

    if (alert.jobType && alert.jobType.length > 0) {
      const displayTypes = alert.jobType.slice(0, 2).map((type) => {
        return type.replace(/_/g, "-").replace(/\b\w/g, (l) => l.toUpperCase());
      });
      badges.push(...displayTypes);
      if (alert.jobType.length > 2) {
        badges.push(`+${alert.jobType.length - 2} more`);
      }
    }

    if (alert.skills && alert.skills.length > 0) {
      const displaySkills = alert.skills.slice(0, 2);
      badges.push(...displaySkills);
      if (alert.skills.length > 2) {
        badges.push(`+${alert.skills.length - 2} skills`);
      }
    }

    if (alert.experienceLevel && alert.experienceLevel.length > 0) {
      const displayLevels = alert.experienceLevel.slice(0, 2).map((level) => {
        return level.charAt(0).toUpperCase() + level.slice(1);
      });
      badges.push(...displayLevels);
      if (alert.experienceLevel.length > 2) {
        badges.push(`+${alert.experienceLevel.length - 2} levels`);
      }
    }

    return badges;
  };

  const location = [alert.city, alert.state].filter(Boolean).join(", ");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{alert.name}</CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription>{alert.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Criteria Badges */}
        {getCriteriaBadges().length > 0 && (
          <div className="flex flex-wrap gap-2">
            {getCriteriaBadges().map((badge, index) => (
              <Badge key={index} variant="secondary">
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {/* Location and Remote */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          )}
          {alert.includeRemote && (
            <Badge variant="outline">Remote OK</Badge>
          )}
        </div>

        {/* Frequency and Last Sent */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="capitalize">{alert.frequency}</span>
          </div>
          {alert.lastSentAt && (
            <span>Last sent: {format(new Date(alert.lastSentAt), "MMM d, yyyy")}</span>
          )}
        </div>

        {/* Search Query */}
        {alert.searchQuery && (
          <div className="text-sm">
            <span className="text-muted-foreground">Keywords: </span>
            <span>{alert.searchQuery}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center space-x-2">
          <Switch
            id={`pause-${alert.id}`}
            checked={!alert.isPaused && alert.isActive}
            onCheckedChange={(checked) => onTogglePause(alert, !checked)}
            disabled={!alert.isActive || isPauseLoading}
          />
          <Label htmlFor={`pause-${alert.id}`} className="cursor-pointer">
            {alert.isPaused ? "Paused" : "Active"}
          </Label>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(alert)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(alert)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
