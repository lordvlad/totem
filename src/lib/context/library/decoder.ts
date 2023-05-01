import { ID3 } from "../../data/id3";

export type Mp3WebWorkerRequest = {
    event: 'load';
    handles: FileSystemFileHandle[];
}

export type Mp3WebWorkerResponse = {
    event: 'loaded';
    n: number;
    total: number;
    file: string;
    meta: ID3;
} | {
    event: 'error';
    error: string;
    n?: number;
    total?: number;
    file?: string;
} | {
    event: 'debug';
    debug: any;
    n?: number;
    total?: number;
    file?: string;
}