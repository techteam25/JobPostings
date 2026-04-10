import { setupServer } from "msw/node";

import { handlers } from "./handlers";

/**
 * MSW server shared across Vitest runs. Started/stopped from `test/setup.ts`
 * and reset between tests so handlers registered via `server.use(...)` don't
 * bleed across test cases.
 */
export const server = setupServer(...handlers);
