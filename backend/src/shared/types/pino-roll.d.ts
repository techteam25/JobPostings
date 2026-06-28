declare module "pino-roll" {
  import type { DestinationStream } from "pino";

  interface PinoRollOptions {
    file: string;
    size?: string | number;
    frequency?: "daily" | "hourly" | number;
    mkdir?: boolean;
    limit?: { count?: number; removeOtherLogFiles?: boolean };
    dateFormat?: string;
    extension?: string;
    symlink?: boolean;
  }

  const pinoRoll: (options: PinoRollOptions) => Promise<DestinationStream>;
  export default pinoRoll;
}
