export interface ModuleWorkers {
  initialize(): void;
  scheduleJobs(): Promise<void>;
}
