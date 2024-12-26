import { Box, Button, Flex, Space, Text, em } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useHelpPanel } from '../HelpPanel'
import { useI18n } from '../../hooks/useI18n/useI18n'
import { iconStyle } from '../../util/constants'
import Feather from '../icons/Feather'
import HelpCircle from '../icons/HelpCircle'
import { LocalePicker } from '../LocalePicker'
import { ThemePicker } from '../ThemePicker'

export function AppHeader() {
  const i18n = useI18n()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)
  const setHelpPanelOpen = useHelpPanel()[1]

  const title = (
    <h1>
      <Feather />
      <Space w='md' style={{ display: 'inline-block' }} />
      Totem
      <Space w='md' style={{ display: 'inline-block' }} />
      <Text component='span' fz='md'>{i18n`your music on your tiptoi`}</Text>
    </h1>
  )

  const menu = (
    <Flex gap='sm' pt='sm'>
      <Button
        variant='outline'
        leftSection={<HelpCircle {...iconStyle} />}
        onClick={() => setHelpPanelOpen(true)}>
        {i18n`Help`}
      </Button>
      <LocalePicker />
      <ThemePicker />
    </Flex>
  )

  return isMobile
    ? (
      <Flex direction='column'>
        {menu}
        {title}
      </Flex>
    )
    : (
      <Flex>
        {title}
        <Box style={{ flexGrow: 1 }} />
        {menu}
      </Flex>
    )
}
