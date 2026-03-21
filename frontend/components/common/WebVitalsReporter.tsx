"use client";

import { useEffect } from "react";
import { reportWebVitals } from "@/lib/web-vitals";

export function WebVitalsReporter() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      reportWebVitals();
    }
  }, []);

  return null;
}
