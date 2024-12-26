import { Box } from "@mantine/core"
import { useBackgroundStyle } from "../../../hooks/useOidCodeBackgroundStyle"
import { useOptions } from "../../../hooks/useOptions"
import { controlIconStyle } from "../../../util/constants"
import { CircleArrowLeft } from "../../icons/CircleArrowLeft"


export function ReplayButton() {
  const { replayOid } = useOptions()[0]
  return (
    <Box pos={'relative'} display={'inline-block'}>
      <Box style={useBackgroundStyle({ code: replayOid })} />
      <CircleArrowLeft {...controlIconStyle} color={'blue'} />
    </Box>
  )
}
