import { MantineFontSize } from "@mantine/core";
import { get, set } from "idb-keyval";
import debounce from "lodash.debounce";
import merge from "lodash.merge";
import { id } from "tsafe/id";
import { proxy, subscribe, useSnapshot } from "valtio";
import { GmeBuildConfig } from "../util/gme/gme";

const initialCommonOptions = {
  projectName: "My Tiptoi Book",
  productId: 0,
  layout: id<"tiles" | "table" | "custom">("tiles"),
  oidCodeResolution: 1200,
  oidCodePixelSize: 2,
  paperSize: id<"A4" | "A4 landscape" | "letter">("A4"),
  penLanguage: "GERMAN" as GmeBuildConfig["language"],
  playAllOid: 7777,
  stopOid: 7778,
  replayOid: 7779,
  debug: false,
};

export type CommonOptions = typeof initialCommonOptions;

const initialAutoOptions = {
  ...initialCommonOptions,
  featureCover: true,
  featureTracks: true,
  featureAlbumInfo: true,
  featureAlbumControls: true,
  featureGeneralControls: true,
};

const initialTileOptions = {
  ...initialAutoOptions,
  layout: "tiles" as CommonOptions["layout"],
  tileSize: id<"1" | "1/2" | "1/3" | "1/4" | "1/6" | "1/12">("1/4"),
  titleFontSize: "lg" as MantineFontSize,
  albumFontSize: "sm" as MantineFontSize,
  artistFontSize: "sm" as MantineFontSize,
  showAlbumName: true,
  showArtistName: true,
};

const initialTableOptions = {
  ...initialAutoOptions,
  layout: "table" as CommonOptions["layout"],
};

const initialCustomOptions = {
  ...initialCommonOptions,
  layout: "custom" as CommonOptions["layout"],
};

export type AutoOptions = typeof initialAutoOptions;
export type TileOptions = typeof initialTileOptions;
export type TableOptions = typeof initialTableOptions;
export type CustomOptions = typeof initialCustomOptions;

export type Options = TableOptions | TileOptions | CustomOptions;

export const initialOptions = id<Options>(initialTileOptions);

export const optionsProxy = proxy<Options>(initialOptions);

get("options").then((options) => {
  if (options) merge(optionsProxy, options);
});

subscribe(
  optionsProxy,
  debounce(() => {
    set("options", { ...optionsProxy });
  }, 300),
);

function setOptions(options: Partial<Options>) {
  merge(optionsProxy, options);
}

export function useOptions() {
  const options = useSnapshot(optionsProxy);
  return [options, setOptions] as const;
}
