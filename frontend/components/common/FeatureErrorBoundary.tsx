"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  className?: string;
}

interface FeatureErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class FeatureErrorBoundary extends Component<
  FeatureErrorBoundaryProps,
  FeatureErrorBoundaryState
> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[${this.props.featureName}] Error caught by boundary:`,
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            "flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6",
            this.props.className,
          )}
        >
          <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
            <AlertTriangle className="text-muted-foreground size-5" />
          </div>
          <div className="max-w-sm text-center">
            <h3 className="mb-1 text-lg font-medium tracking-tight">
              Something went wrong
            </h3>
            <p className="text-muted-foreground text-sm">
              We couldn&apos;t load {this.props.featureName}. Please try again.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => this.setState({ hasError: false })}
          >
            <RefreshCcw className="mr-2 size-4" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
