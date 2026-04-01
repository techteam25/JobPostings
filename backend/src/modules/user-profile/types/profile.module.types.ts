import { Readable } from "node:stream";

interface File {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  stream: Readable;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export type ProfilePictureFile = File;
export type ResumeFile = File;
