import axios from "axios";
import { env } from "../env";

export const instance = axios.create({
  baseURL: env.SERVER_URL,
  timeout: 1000,
  headers: { "X-Custom-Header": "foobar" },
});
