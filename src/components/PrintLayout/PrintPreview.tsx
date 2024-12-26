import { Box } from "@mantine/core"
import { useOptions, type Options } from "../../hooks/useOptions"
import { TablePrintLayout } from "./TablePrintLayout"
import { TilePrintLayout } from "./TilePrintLayout"

const paperDimensions: Record<Options['paperSize'], { height: string, width: string }> = {
  A4: { height: '29.7cm', width: '21cm' },
  'A4 landscape': { height: '21cm', width: '29.7cm' },
  letter: { height: '27.9cm', width: '21.6cm' }
}

export function PrintPreview() {
  const { layout, paperSize } = useOptions()[0]

  const sx = {
    background: 'white',
    borderWidth: '1px',
    borderStyle: 'solid',
    ...paperDimensions[paperSize]
  }

  return <Box style={sx}>{layout === 'tiles' ? <TilePrintLayout /> : <TablePrintLayout />}</Box>
}
