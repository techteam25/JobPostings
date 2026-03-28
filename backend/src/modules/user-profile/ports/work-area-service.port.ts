import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type { WorkArea } from "@/modules/user-profile";

export interface WorkAreaServicePort {
  getAllWorkAreas(): Promise<Result<WorkArea[], AppError>>;

  getSelectedWorkAreas(userId: number): Promise<Result<WorkArea[], AppError>>;

  updateWorkAreas(
    userId: number,
    workAreaIds: number[],
  ): Promise<Result<void, AppError>>;
}
