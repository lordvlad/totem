/// <reference types="@types/wicg-file-system-access" />

import { Button, Flex, Kbd } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { useCallback, useEffect, useRef } from 'react'
import Music2 from '../components/icons/Music2'
import Trash from '../components/icons/Trash'
import { useLibrary } from '../hooks/useLibrary'
import { useSelection } from '../hooks/selection'
import { iconStyle, kbdStyle } from '../util/constants'
import { useI18n } from '../hooks/useI18n'

export function AudioToolbar() {
  const i18n = useI18n()
  const { selected, reset } = useSelection()
  const { value: { tracks, isLoading }, load, remove, clear } = useLibrary()

  const onDeleteSelection = useCallback(() => {
    const selectedTracks = tracks.filter((_, idx) => selected.has(idx))
    reset()
    remove(...selectedTracks)
  }, [selected, tracks])

  const onChooseFilesClick = async () => {
    const opts = { multiple: true, types: [{ description: 'Audio', accept: { 'audio/*': ['.mp3' as const] } }] }
    const handles: FileSystemFileHandle[] = await window.showOpenFilePicker(opts)
    load(handles)
  }

  // useHotkeys will be set up ONCE only, so we need to work around it having a stale
  // reference to onDeleteSelection
  const r = useRef<() => void>()
  useEffect(() => { r.current = onDeleteSelection }, [selected, tracks])

  useHotkeys([
    ['mod+o', async () => await onChooseFilesClick()],
    ['mod+Delete', () => clear()],
    ['Delete', () => r.current?.call(null)]
  ])

  return (
    <Flex gap='xs' wrap='wrap'>
      <Button
        disabled={isLoading}
        loading={isLoading}
        onClick={onChooseFilesClick}
        leftSection={<Music2 {...iconStyle} />}
        pr={8}
      >
        {(tracks.length > 0) ? i18n`Add more` : i18n`Choose Files`}
        <Kbd ml={8}>{i18n`ctrl + O`}</Kbd>
      </Button>
      <Button
        pr={8}
        disabled={isLoading || tracks.length === 0}
        onClick={() => selected.size ? onDeleteSelection() : clear()}
        leftSection={<Trash {...iconStyle} />}
      >
        {selected.size ? i18n`Remove` : i18n`Clear`}
        <Kbd {...kbdStyle}>{selected.size ? i18n`del` : 'ctrl + del'}</Kbd>
      </Button>
    </Flex>
  )
}
