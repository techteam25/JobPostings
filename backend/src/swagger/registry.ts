import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export { z };

export const registry = new OpenAPIRegistry();
