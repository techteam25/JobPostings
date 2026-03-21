export interface ApplicationInsightsPort {
  incrementJobApplications(jobId: number): Promise<void>;
}
