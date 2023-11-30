/// <reference types="@types/wicg-file-system-access" />

import { Button, Checkbox, Flex, Kbd, Modal } from '@mantine/core'
import { useDisclosure, useHotkeys, useLocalStorage } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useCallback, useEffect, useRef, useState } from "react"
import Feather from '../components/icons/Feather'
import Music2 from '../components/icons/Music2'
import Printer from '../components/icons/Printer'
import Settings from '../components/icons/Settings'
import Trash from '../components/icons/Trash'
import { useLibrary } from "../stores/library"
import { useOptions, useOptionsPanel } from "../stores/options"
import { useSelection } from "../stores/selection"
import { GmeBuildConfig } from "../util/gme/gme"
import { useGmeBuilder } from "../util/gme/useGmeBuilder"
import { useI18n } from "../util/i18n/i18n"


export function Menu() {
    const i18n = useI18n()
    const { selected, reset } = useSelection()
    const { tracks, load, isLoading, remove, clear } = useLibrary(x => x)
    const [isBundling, setIsBundling] = useState(false)
    const setShowOptionsPanel = useOptionsPanel()[1]
    const options = useOptions()
    const { build } = useGmeBuilder()


    const onDeleteSelection = useCallback(() => {
        const selectedTracks = tracks.filter((_, idx) => selected.has(idx))
        reset()
        remove(...selectedTracks)
    }, [selected, tracks])

    const onChooseFilesClick = async () => {
        const opts = { multiple: true, types: [{ description: "Audio", accept: { "audio/*": [".mp3" as const] } }] }
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

    const [printHintRead, setPrintHintRead] = useLocalStorage({ key: 'print-hint-read', defaultValue: false })
    const [printHintOpened, { open: openPrintHint, close: closePrintHint }] = useDisclosure(false);


    const onPrintClick = useCallback(() => {
        if (printHintRead) { window.print() } else { openPrintHint() }
    }, [printHintRead])

    const onPrintHintClose = useCallback(() => {
        closePrintHint()
        setTimeout(() => window.print(), 1)
    }, [closePrintHint])


    return (
        <Flex gap="xs" wrap="wrap">

            <Modal withCloseButton={false} opened={printHintOpened} onClose={onPrintHintClose} title={i18n`Print`} centered>
                {i18n`For optimal results in chrome, make sure to open 'More Settings' in the print dialog and then:`}
                <ul>
                    <li>{i18n`Uncheck 'Headers and footers'`}</li>
                    <li>{i18n`Check 'Background graphics'`}</li>
                </ul>

                <Flex gap="xs" align={'center'}>
                    <Checkbox label={i18n`Do not show again`} onChange={(e) => setPrintHintRead(e.target.checked)}></Checkbox>
                    <Flex style={{ flexGrow: 1 }}></Flex>
                    <Button onClick={onPrintHintClose}>OK</Button>
                </Flex>
            </Modal>

            <Button
                disabled={isBundling}
                loading={isLoading}
                onClick={onChooseFilesClick}
                leftSection={<Music2 />}
                pr={8} >
                {tracks.length ? i18n`Add more` : i18n`Choose Files`}
                <Kbd ml={8} >{i18n`ctrl+O`}</Kbd>
            </Button>
            <Button
                pr={8}
                disabled={isBundling || isLoading || tracks.length === 0}
                onClick={() => selected.size ? onDeleteSelection() : clear()}
                leftSection={<Trash />}>
                {selected.size ? i18n`Remove` : i18n`Clear`}
                <Kbd ml={8}>{selected.size ? i18n`del` : 'ctrl+del'}</Kbd>
            </Button>
            <Button
                pr={8}
                disabled={isLoading || tracks.length === 0}
                onClick={onBundleClick}
                loading={isBundling}
                leftSection={<Feather />} >
                {i18n`Save to tiptoi`}
                <Kbd ml={8}>{i18n`ctrl+S`}</Kbd>
            </Button>
            <Button
                pr={8}
                onClick={() => setShowOptionsPanel(true)}
                leftSection={<Settings />}>
                {i18n`Options`}
                <Kbd ml={8}>{i18n`alt+O`}</Kbd>
            </Button>
            <Button
                pr={8}
                disabled={isBundling || isLoading || tracks.length === 0}
                onClick={onPrintClick}
                leftSection={<Printer />} >
                {i18n`Print`}
                <Kbd ml={8}>{i18n`ctrl+P`}</Kbd>
            </Button>
        </Flex>
    )
}