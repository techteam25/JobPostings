import { AxiosError, type AxiosResponse } from "axios";
import { instance } from "../axios-instance";
import { ApiError } from "../types";

const originalAdapter = instance.defaults.adapter;

describe("Axios API error conversion", () => {
  afterEach(() => {
    instance.defaults.adapter = originalAdapter;
  });

  it("preserves nested validation messages and field details", async () => {
    instance.defaults.adapter = async (config) => {
      const response: AxiosResponse = {
        config,
        data: {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: [
              { field: "body.phoneNumber", message: "Invalid phone number" },
            ],
          },
        },
        headers: {},
        status: 400,
        statusText: "Bad Request",
      };
      throw new AxiosError(
        "Request failed with status code 400",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        response,
      );
    };

    await expect(instance.get("/profile")).rejects.toMatchObject({
      name: "ApiError",
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: [{ field: "body.phoneNumber", message: "Invalid phone number" }],
    } satisfies Partial<ApiError>);
  });
});
