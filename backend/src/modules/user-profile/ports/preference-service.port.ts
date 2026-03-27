import type { Result } from "@shared/result";
import type { AppError } from "@shared/errors";
import type { JobPreference } from "@/modules/user-profile/ports/preference-repository.port";
import type { PatchJobPreferenceBody } from "@/validations/jobPreference.validation";

export interface PreferenceServicePort {
  getJobPreferences(
    userId: number,
  ): Promise<Result<JobPreference | null, AppError>>;

  updateJobPreferences(
    userId: number,
    data: PatchJobPreferenceBody,
  ): Promise<Result<JobPreference, AppError>>;
}
