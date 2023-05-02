import { Button, Card, Checkbox, Code, Table, Text } from "@geist-ui/core"
import { type CheckboxEvent } from "@geist-ui/core/esm/checkbox"
import { Trash } from "@geist-ui/icons"
import { useEffect, useCallback } from "preact/hooks"
import { useI18n } from "../context/i18n/i18n"
import { useLibrary } from "../context/library/library"
import { useSelection } from "../context/selection"
import { Track } from "../data/track"
import { useDropZone } from "../hooks/useDropZone"
import { Editable } from "../components/Editable"

function pd<E extends Event>(f: (e: E) => void) {
    return function (e: E) {
        e.preventDefault()
        e.stopPropagation()
        f(e)
    }
}

export function Tracks() {
    const i18n = useI18n()
    const { onDrop, remove, tracks, update } = useLibrary(x => x)

    const { ref, isOver } = useDropZone({ onDrop })
    const { selected, toggle, reset, select } = useSelection()

    const renderTitle = (_: any, track: Track) =>
        <Editable text={track.title} placeholder={i18n`unknown`} onChange={title => update(Object.assign(track, { title }))} />
    const renderArtist = (_: any, track: Track) =>
        <Editable text={track.artist} placeholder={i18n`unknown`} onChange={artist => update(Object.assign(track, { artist }))} />
    const renderAlbum = (_: any, track: Track) =>
        <Editable text={track.album} placeholder={i18n`unknown`} onChange={album => update(Object.assign(track, { album }))} />

    const renderAction = useCallback((_: any, track: Track) => {
        return (
            <Button type="error" auto scale={1 / 3} font="12px" onClick={pd(() => remove(track))} icon={<Trash />}>
                {i18n`Remove`}
            </Button>
        )
    }, [])

    const renderCheckbox = useCallback((_: any, __: any, idx: number) => (
        <Checkbox onChange={() => toggle(idx)} checked={selected.has(idx)} />
    ), [selected])

    if (!tracks.length) {
        return (
            <Card shadow ref={ref} type={isOver ? 'success' : undefined}>
                <Text h4 my={0}>{i18n`Your music files will show up here`}</Text>
                <Text>{i18n`Use the`} <Code>{i18n`Choose Files`}</Code> {i18n`button to pick some files or simply drag-and-drop them on this card`}.</Text>
            </Card>
        )
    }

    return (
        <Table hover
            ref={ref}
            data={tracks}
            type={isOver ? 'success' : undefined} >
            <Table.Column
                width={1}
                prop="select"
                render={renderCheckbox}
                label={
                    <Checkbox
                        onChange={(e: CheckboxEvent) => {
                            if (e.target.checked) {
                                select(...tracks.map((_, idx) => idx))
                            } else {
                                reset()
                            }
                        }}
                    />}
            />
            <Table.Column prop="title" label={i18n`Title`} render={renderTitle} />
            <Table.Column prop="album" label={i18n`Album`} render={renderAlbum} />
            <Table.Column prop="artist" label={i18n`Artist`} render={renderArtist} />
            <Table.Column prop="remove" label={i18n`Actions`} width={150} render={renderAction} />
        </Table>
    )
}