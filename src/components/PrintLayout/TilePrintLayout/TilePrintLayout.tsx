import { Grid } from "@mantine/core"
import { assert, is } from "tsafe/assert"
import { useLibrary } from "../../../hooks/useLibrary"
import { type TileOptions, useOptions } from "../../../hooks/useOptions"
import { AlbumInfo } from "../AlbumInfo"
import { Controls, PowerButton } from "../Controls"
import { DebugInfo } from "../DebugInfo"
import { PrintTile } from "./PrintTile"

export function TilePrintLayout() {
  const options = useOptions()[0]

  assert(is<TileOptions>(options))

  const { tileSize, featureTracks, featureAlbumInfo } = options

  const { value: tracks } = useLibrary('tracks')

  const span = 1 / parseInt(tileSize.replace('1/', '')) * 12

  return (
    <>
      <DebugInfo />
      <PowerButton />
      {featureAlbumInfo && <AlbumInfo />}
      <Controls />
      {featureTracks && (
        <Grid gutter={4}>
          {tracks.map((track, i) =>
            <Grid.Col key={`${track.artist}${track.album}${track.title}`} span={span}>
              <PrintTile code={3944 + i} track={track} />
            </Grid.Col>
          )}
        </Grid>
      )}
    </>
  )
}
