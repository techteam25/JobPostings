import axios from "axios";
import { env } from "@/env";

export const instance = axios.create({
  baseURL: env.NEXT_PUBLIC_SERVER_URL,
  timeout: 1000,
  withCredentials: true,
});
