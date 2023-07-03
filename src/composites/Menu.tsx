/// <reference types="@types/wicg-file-system-access" />

import { Button, Flex, Kbd } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useCallback, useEffect, useRef, useState } from "react"
import { GmeBuildConfig } from "../gme/gme"
import { useGmeBuilder } from "../gme/useGmeBuilder"
import { useGlobalState } from "../hooks/useGlobalState"
import { useI18n } from "../i18n/i18n"
import Feather from '../icons/Feather'
import Music2 from '../icons/Music2'
import Printer from '../icons/Printer'
import Settings from '../icons/Settings'
import Trash from '../icons/Trash'
import { initialPrintOptions } from "../library/options"
import { useLibrary } from "../library/useLibrary"
import { useSelection } from "../library/useSelection"


export function Menu() {
    const i18n = useI18n()
    const { selected, reset } = useSelection()
    const { tracks, load, isLoading, remove, clear } = useLibrary(x => x)
    const [isBundling, setIsBundling] = useState(false)
    const setShowOptionsPanel = useGlobalState('showOptionsPanel', false)[1]
    const options = useGlobalState('options', initialPrintOptions)[0]
    const { build } = useGmeBuilder()

    const onDeleteSelection = useCallback(() => {
        const selectedTracks = tracks.filter((_, idx) => selected.has(idx))
        reset()
        remove(...selectedTracks)
    }, [selected, tracks])

    const onChooseFilesClick = async () => {
        const opts = { multiple: true, types: [{ description: "Audio", accept: { "audio/*": [".mp3"] } }] }
        const handles: FileSystemFileHandle[] = await window.showOpenFilePicker(opts)
        load(handles)
    }

    const onBundleClick = useCallback(async () => {
        if (tracks.length === 0) return

        setIsBundling(true)
        try {
            const handle: FileSystemFileHandle = await window.showSaveFilePicker({
                suggestedName: `file.gme`,
                types: [
                    {
                        description: "GME",
                        accept: {
                            "application/gme": [".gme"],
                        },
                    },
                ],
            })

            const stream = await handle.createWritable()

            const cfg: GmeBuildConfig = {
                tracks,
                productId: 0,
                language: 'GERMAN', // FIXME
            }

            await build(cfg).pipeTo(stream)
        } catch (e) {
            notifications.show({
                title: "Error",
                message: String(e),
                autoClose: 10 * 1000,
                icon: <Feather />,
            })
        } finally {
            setIsBundling(false)
        }
    }, [tracks, options])

    // useHotkeys will be set up ONCE only, so we need to work around it having a stale
    // reference to onDeleteSelection
    const r = useRef<() => void>()
    useEffect(() => { r.current = onDeleteSelection }, [selected, tracks])

    useHotkeys([
        ['alt+o', () => setShowOptionsPanel(true)],
        ['mod+o', () => onChooseFilesClick()],
        ['mod+s', () => onBundleClick()],
        ['mod+Delete', () => clear()],
        ['Delete', () => r.current?.call(null)],
    ])

    // function downloadPdf() {
    // throw new Error("Function not implemented.")
    // }

    return (
        <Flex gap="xs">
            <Button
                disabled={isBundling}
                loading={isLoading}
                loaderPosition='center'
                onClick={onChooseFilesClick}
                leftIcon={<Music2 />}
                pr={8} >
                {tracks.length ? i18n`Add more` : i18n`Choose Files`}
                <Kbd ml={8} >{i18n`ctrl+O`}</Kbd>
            </Button>
            <Button
                pr={8}
                disabled={isBundling || isLoading || tracks.length === 0}
                onClick={() => selected.size ? onDeleteSelection() : clear()}
                leftIcon={<Trash />}>
                {selected.size ? i18n`Remove` : i18n`Clear`}
                <Kbd ml={8}>{selected.size ? i18n`del` : 'ctrl+del'}</Kbd>
            </Button>
            <Button
                pr={8}
                disabled={isLoading || tracks.length === 0}
                onClick={onBundleClick}
                loading={isBundling}
                loaderPosition='center'
                leftIcon={<Feather />} >
                {i18n`Save to tiptoi`}
                <Kbd ml={8}>{i18n`ctrl+S`}</Kbd>
            </Button>
            <Button
                pr={8}
                onClick={() => setShowOptionsPanel(true)}
                leftIcon={<Settings />}>
                {i18n`Options`}
                <Kbd ml={8}>{i18n`alt+O`}</Kbd>
            </Button>
            <Button
                pr={8}
                disabled={isBundling || isLoading || tracks.length === 0}
                onClick={() => window.print()}
                leftIcon={<Printer />} >
                {i18n`Print`}
                <Kbd ml={8}>{i18n`ctrl+P`}</Kbd>
            </Button>
        </Flex>
    )
}