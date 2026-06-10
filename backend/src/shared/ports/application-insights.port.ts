export interface ApplicationInsightsPort {
  syncJobApplicationCount(jobId: number): Promise<void>;
}
