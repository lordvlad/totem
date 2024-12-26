import { Box } from '@mantine/core'
import { useOptions } from '../../hooks/useOptions'
import { TablePrintLayout } from './TablePrintLayout'
import { TilePrintLayout } from './TilePrintLayout'

export function PrintLayout() {
  const { layout } = useOptions()[0]

  return <Box className='print-only'>{layout === 'tiles' ? <TilePrintLayout /> : <TablePrintLayout />}</Box>
}
