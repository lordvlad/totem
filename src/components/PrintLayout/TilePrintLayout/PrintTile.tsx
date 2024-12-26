import { Box, Card, Text } from "@mantine/core"
import { useBackgroundStyle } from "../../../hooks/useOidCodeBackgroundStyle"
import { type TileOptions, useOptions } from "../../../hooks/useOptions"
import { type Track } from "../../../util/mp3/track"
import { AlbumArt } from "../../AudioPanel"

export function PrintTile({ track, code }: { track: Track, code: number }) {
  const { featureCover, showAlbumName, showArtistName, artistFontSize, albumFontSize, titleFontSize } = useOptions()[0] as TileOptions
  const style = useBackgroundStyle({ code })
  return (
    <Card key={`${track.artist}${track.album}${track.title}`}>
      <Box style={style} />
      {featureCover && <Card.Section><AlbumArt track={track} /></Card.Section>}
      <Text fz={titleFontSize}>{track.title}</Text>
      {showAlbumName && (<Text fz={albumFontSize}>{track.album}</Text>)}
      {showArtistName && (<Text fz={artistFontSize}>{track.artist}</Text>)}
    </Card>
  )
}
