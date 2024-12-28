import { Box } from "@mantine/core";
import { useBackgroundStyle } from "../../../hooks/useOidCodeBackgroundStyle";
import { useOptions } from "../../../hooks/useOptions";
import { controlIconStyle } from "../../../util/constants";
import { CircleStop } from "../../icons/CircleStop";

export function StopButton() {
  const { stopOid } = useOptions()[0];
  return (
    <Box pos={"relative"} display={"inline-block"}>
      <Box style={useBackgroundStyle({ code: stopOid })} />
      <CircleStop {...controlIconStyle} color={"red"} />
    </Box>
  );
}
