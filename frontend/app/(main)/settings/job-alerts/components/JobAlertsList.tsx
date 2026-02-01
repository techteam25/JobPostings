"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { JobAlert } from "@/lib/types";
import { JobAlertCard } from "./JobAlertCard";
import { CreateJobAlertDialog } from "./CreateJobAlertDialog";
import { EditJobAlertDialog } from "./EditJobAlertDialog";
import { DeleteJobAlertDialog } from "./DeleteJobAlertDialog";
import { useJobAlerts, useTogglePauseJobAlert } from "../hooks/manage-job-alerts";
import { AlertCircle, Plus, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function JobAlertsList() {
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<JobAlert | null>(null);

  const { data, isLoading, isError } = useJobAlerts(page, 10);
  const togglePauseMutation = useTogglePauseJobAlert();

  const alerts = data?.data || [];
  const pagination = data?.pagination;

  const activeAlertsCount = alerts.filter((alert) => alert.isActive && !alert.isPaused).length;
  const isAtLimit = activeAlertsCount >= 10;

  const handleEdit = (alert: JobAlert) => {
    setSelectedAlert(alert);
    setEditDialogOpen(true);
  };

  const handleDelete = (alert: JobAlert) => {
    setSelectedAlert(alert);
    setDeleteDialogOpen(true);
  };

  const handleTogglePause = (alert: JobAlert, isPaused: boolean) => {
    togglePauseMutation.mutate({ id: alert.id, isPaused });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Job Alerts</h2>
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Job Alerts</h2>
            <p className="text-muted-foreground">Unable to load alerts</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load job alerts. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Alerts</h2>
          <p className="text-muted-foreground">
            You have {activeAlertsCount} of 10 active alerts
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} disabled={isAtLimit}>
          <Plus className="h-4 w-4 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Warning for near limit */}
      {activeAlertsCount >= 8 && activeAlertsCount < 10 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are approaching the limit of 10 active job alerts. You have {10 - activeAlertsCount} slots remaining.
          </AlertDescription>
        </Alert>
      )}

      {/* At limit warning */}
      {isAtLimit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have reached the maximum of 10 active job alerts. Delete or pause an alert to create a new one.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold mb-2">No job alerts yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first job alert to receive notifications when matching jobs are posted.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Alert
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <JobAlertCard
              key={alert.id}
              alert={alert}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTogglePause={handleTogglePause}
              isPauseLoading={togglePauseMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={!pagination.hasPrevious}
            onClick={() => setPage(pagination.previousPage!)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!pagination.hasNext}
            onClick={() => setPage(pagination.nextPage!)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <CreateJobAlertDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditJobAlertDialog alert={selectedAlert} open={editDialogOpen} onOpenChange={setEditDialogOpen} />
      <DeleteJobAlertDialog alert={selectedAlert} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
    </div>
  );
}
