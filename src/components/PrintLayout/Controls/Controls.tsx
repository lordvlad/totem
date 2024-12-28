import { Group } from "@mantine/core";
import { assert, is } from "tsafe/assert";
import { AutoOptions, useOptions } from "../../../hooks/useOptions";
import { PlayAllButton } from "./PlayAllButton";
import { ReplayButton } from "./ReplayButton";
import { StopButton } from "./StopButton";

export function Controls() {
  const options = useOptions()[0];

  assert(is<AutoOptions>(options));

  const { featureAlbumControls, featureGeneralControls } = options;

  if (!featureAlbumControls && !featureGeneralControls) return null;

  return (
    <Group gap={4}>
      {featureAlbumControls && (
        <>
          <PlayAllButton />
        </>
      )}
      {featureGeneralControls && (
        <>
          <StopButton />
          <ReplayButton />
        </>
      )}
    </Group>
  );
}
