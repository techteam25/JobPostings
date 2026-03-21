import { ApiResponse, ServerActionPaginatedResponse } from "@/lib/types";

export async function handleApiResponse<T>(
  res: Response,
  fallbackMessage: string,
): Promise<ApiResponse<T>> {
  return res.json().catch(() => ({
    success: false as const,
    message: fallbackMessage,
    errorCode: "PARSE_ERROR",
  }));
}

export async function handlePaginatedApiResponse<T>(
  res: Response,
  fallbackMessage: string,
): Promise<ServerActionPaginatedResponse<T>> {
  return res.json().catch(() => ({
    success: false as const,
    message: fallbackMessage,
    errorCode: "PARSE_ERROR",
  }));
}
