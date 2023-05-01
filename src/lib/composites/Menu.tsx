import { Button, Grid, KeyCode, KeyMod, Keyboard, Spacer, useKeyboard, useToasts } from "@geist-ui/core"
import { useI18n } from "../context/i18n/i18n"
import { useCallback, useEffect, useRef, useState } from "preact/hooks"
import { useTracks } from "../context/tracks"
import { Archive, Music, Printer, Settings, Trash } from "@geist-ui/icons"
import { useSelection } from "../context/selection"
import { useGlobalState } from "../hooks/useGlobalState"
import { tttool } from "../telefunc/tttool.telefunc"
import { initialOptions } from "../data/options"

export function Menu() {
    const i18n = useI18n()
    const { setToast } = useToasts()
    const { selected, reset } = useSelection()
    const { tracks, clear, isLoading, remove, load } = useTracks()
    const [isBundling, setIsBundling] = useState(false)
    const setShowOptionsPanel = useGlobalState('showOptionsPanel', false)[1]
    const options = useGlobalState('options', initialOptions)[0]

    const onDeleteSelection = useCallback(() => {
        const selectedTracks = tracks.filter((_, idx) => selected.has(idx))
        reset()
        remove(...selectedTracks)
    }, [selected, tracks])

    // const mp3WebWorker = useMp3WebWorker((resp) => {
    //     switch (resp.event) {
    //         case 'loaded': {
    //             add(resp.meta)
    //             if (resp.n === resp.total) setIsLoading(false)
    //             break;
    //         }
    //         case 'error': {
    //             setToast({ type: 'error', text: `Failed to load ${resp.file}: ${resp.error}` })
    //             break;
    //         }
    //         default: console.log(resp)
    //     }
    // })

    const onChooseFilesClick = async () => {
        const opts = { multiple: true, types: [{ description: "Audio", accept: { "audio/*": [".mp3"] } }] }
        const handles: FileSystemFileHandle[] = await (window as any).showOpenFilePicker(opts)
        load(handles)
    }

    const onBundleClick = useCallback(async () => {
        setIsBundling(true)
        try {
            if (tracks.length === 0) return
            console.log("bundling tracks", tracks)

            const { message } = await tttool({ options, tracks })

            console.log(message)
        } finally {
            setIsBundling(false)
        }

    }, [tracks, options])

    useKeyboard(() => setShowOptionsPanel(true), [KeyCode.KEY_O, KeyMod.Alt])
    useKeyboard(() => onChooseFilesClick(), [KeyCode.KEY_O, KeyMod.CtrlCmd])
    useKeyboard(() => onBundleClick(), [KeyCode.KEY_S, KeyMod.CtrlCmd])

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
                <Keyboard scale={1 / 3}>{selected.size ? i18n`del` : 'F5'}</Keyboard>
            </Button>
        </Grid>
        <Grid>
            <Button
                disabled={isLoading || tracks.length === 0}
                onClick={onBundleClick}
                loading={isBundling}
                auto
                icon={<Archive />}
                type="success">
                {i18n`Save Bundle`}
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