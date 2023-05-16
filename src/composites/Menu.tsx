/// <reference types="@types/wicg-file-system-access" />

import { Button, Grid, KeyCode, KeyMod, Keyboard, Spacer, useKeyboard, useToasts } from "@geist-ui/core"
import { Feather, Music, Printer, Settings, Trash } from "@geist-ui/icons"
import { useCallback, useEffect, useRef, useState } from "preact/hooks"
import { useI18n } from "../i18n/i18n"
import { useLibrary } from "../library/useLibrary"
import { useSelection } from "../library/useSelection"
import { initialPrintOptions } from "../library/options"
import { useGlobalState } from "../hooks/useGlobalState"
import { useGmeBuilder } from "../gme/useGmeBuilder"
import { GmeBuildConfig } from "../gme/gme"

export function Menu() {
    const i18n = useI18n()
    const { setToast } = useToasts()
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
            setToast({ type: "error", text: String(e), delay: 10 * 1000 })
        } finally {
            setIsBundling(false)
        }
    }, [tracks, options])

    useKeyboard(() => setShowOptionsPanel(true), [KeyCode.KEY_O, KeyMod.Alt])
    useKeyboard(() => onChooseFilesClick(), [KeyCode.KEY_O, KeyMod.CtrlCmd])
    useKeyboard(() => onBundleClick(), [KeyCode.KEY_S, KeyMod.CtrlCmd])
    useKeyboard(() => clear(), [KeyCode.Delete, KeyMod.CtrlCmd])

    // use keyboard will be set up ONCE only, so we need to work around it having a stale
    // reference to onDeleteSelection
    const r = useRef<() => void>()
    useEffect(() => { r.current = onDeleteSelection }, [selected, tracks])
    useKeyboard(() => r.current?.call(null), [KeyCode.Delete])

    function downloadPdf() {
        throw new Error("Function not implemented.")
    }

    return (<Grid.Container gap={1}>
        <Grid>
            <Button
                auto
                disabled={isBundling}
                loading={isLoading}
                onClick={onChooseFilesClick}
                icon={<Music />}
                type="primary">
                {tracks.length ? i18n`Add more` : i18n`Choose Files`}
                <Spacer w={.5} />
                <Keyboard scale={1 / 3} >{i18n`ctrl+O`}</Keyboard>
            </Button>
        </Grid>
        <Grid>
            <Button
                disabled={isBundling || isLoading || tracks.length === 0}
                onClick={() => selected.size ? onDeleteSelection() : clear()}
                auto
                icon={<Trash />}
                type="warning">
                {selected.size ? i18n`Remove` : i18n`Clear`}
                <Spacer w={.5} />
                <Keyboard scale={1 / 3}>{selected.size ? i18n`del` : 'ctrl+del'}</Keyboard>
            </Button>
        </Grid>
        <Grid>
            <Button
                disabled={isLoading || tracks.length === 0}
                onClick={onBundleClick}
                loading={isBundling}
                auto
                icon={<Feather />}
                type="success">
                {i18n`Save to tiptoi`}
                <Spacer w={.5} />
                <Keyboard scale={1 / 3} >{i18n`ctrl+S`}</Keyboard>
            </Button>
        </Grid>
        <Grid>
            <Button
                auto
                onClick={() => setShowOptionsPanel(true)}
                icon={<Settings />}>
                {i18n`Options`}
                <Spacer w={.5} />
                <Keyboard scale={1 / 3}>{i18n`alt+O`}</Keyboard>
            </Button>
        </Grid>
        <Grid>
            <Button
                auto
                disabled={isBundling || isLoading || tracks.length === 0}
                onClick={() => window.print()}
                icon={<Printer />} >
                {i18n`Print`}
                <Spacer w={.5} />
                <Keyboard scale={1 / 3}>{i18n`ctrl+P`}</Keyboard>
            </Button>
        </Grid>
    </Grid.Container>
    )
}