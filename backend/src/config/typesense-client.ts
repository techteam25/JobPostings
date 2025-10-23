import Typesense from "typesense";

import { env } from "./env";

export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: env.TYPESENSE_HOST,
      port: env.TYPESENSE_PORT,
      protocol: env.TYPESENSE_PROTOCOL,
    },
  ],
  apiKey: env.TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 2,
});
