import { ApiResponse } from "@/schemas/responses/index";

type UserIntent = {
  intent: "seeker" | "employer";
  status: "pending" | "completed";
};

export type UserIntentResponse = ApiResponse<UserIntent>;
