import { Box } from "@mantine/core";
import { useOptions } from "../../../hooks/useOptions";
import { useBackgroundStyle } from "../../../hooks/useOidCodeBackgroundStyle";
import { controlIconStyle } from "../../../util/constants";
import { CirclePower } from "../../icons/CirclePower";

export function PowerButton() {
  const { productId } = useOptions()[0];
  return (
    <Box pos={"relative"} display={"inline-block"}>
      <Box style={useBackgroundStyle({ code: productId })} />
      <CirclePower {...controlIconStyle} color={"green"} />
    </Box>
  );
}
