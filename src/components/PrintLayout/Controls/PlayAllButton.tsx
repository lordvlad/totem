import { Box } from "@mantine/core"
import { useBackgroundStyle } from "../../../hooks/useOidCodeBackgroundStyle"
import { useOptions } from "../../../hooks/useOptions"
import { controlIconStyle } from "../../../util/constants"
import { CirclePlay } from "../../icons/CirclePlay"


export function PlayAllButton() {
  const { playAllOid } = useOptions()[0]
  return (
    <Box pos={'relative'} display={'inline-block'}>
      <Box style={useBackgroundStyle({ code: playAllOid })} />
      <CirclePlay {...controlIconStyle} color={'blue'} />
    </Box>
  )
}
