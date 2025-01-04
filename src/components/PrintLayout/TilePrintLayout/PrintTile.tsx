import { Card, Text } from "@mantine/core";
import { type TileOptions, useOptions } from "../../../hooks/useOptions";
import { type Track } from "../../../util/mp3/track";
import { AlbumArt } from "../../AudioPanel";
import { OIDCodeBox } from "../../OIDCode/OIDCodeBox";
import { useLibrary } from "../../../hooks/useLibrary";

export function PrintTile({ track }: { track: Track }) {
  const {
    featureCover,
    showAlbumName,
    showArtistName,
    artistFontSize,
    albumFontSize,
    titleFontSize,
  } = useOptions()[0] as TileOptions;
  const { value: tracks } = useLibrary("tracks");
  const code = tracks.indexOf(track) + 1401;

  return (
    <OIDCodeBox code={code}>
      <Card key={`${track.artist}${track.album}${track.title}`}>
        {featureCover && (
          <Card.Section>
            <AlbumArt track={track} />
          </Card.Section>
        )}
        <Text fz={titleFontSize}>{track.title}</Text>
        {showAlbumName && <Text fz={albumFontSize}>{track.album}</Text>}
        {showArtistName && <Text fz={artistFontSize}>{track.artist}</Text>}
      </Card>
    </OIDCodeBox>
  );
}
