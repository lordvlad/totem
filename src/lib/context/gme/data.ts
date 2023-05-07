import { Track } from "../../data/track";

export type GmeBuildConfig = {
    productId: number;
    tracks: Track[];
    lang?: "GERMAN" | "DUTCH" | "FRENCH" | "ITALIAN" | "RUSSIA"
};

export type Req = {
    event: "build";
    writablePort: MessagePort,
} & GmeBuildConfig

