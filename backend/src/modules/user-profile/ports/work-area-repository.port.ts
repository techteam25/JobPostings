import type { workAreas } from "@/db/schema";

export type WorkArea = Pick<typeof workAreas.$inferSelect, "id" | "name">;

export interface WorkAreaRepositoryPort {
  getAllWorkAreas(): Promise<WorkArea[]>;
  getSelectedWorkAreas(jobPreferenceId: number): Promise<WorkArea[]>;
  replaceWorkAreas(
    jobPreferenceId: number,
    workAreaIds: number[],
  ): Promise<void>;
}

export interface WorkAreaQueryPort {
  getSelectedWorkAreas(jobPreferenceId: number): Promise<WorkArea[]>;
}
