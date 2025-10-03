import type { ID3 } from "./id3";

export interface Mp3WebWorkerRequest {
  event: "load";
  handles: FileSystemFileHandle[];
}

export type Mp3WebWorkerResponse =
  | {
      event: "loaded";
      n: number;
      total: number;
      file: string;
      meta: ID3 & { uuid: string };
    }
  | {
      event: "error";
      error: string;
      n?: number;
      total?: number;
      file?: string;
    }
  | {
      event: "debug";
      debug: unknown;
      n?: number;
      total?: number;
      file?: string;
    };
