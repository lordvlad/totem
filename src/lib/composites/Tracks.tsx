import { Button, Card, Checkbox, Code, Table, Text } from "@geist-ui/core"
import { type CheckboxEvent } from "@geist-ui/core/esm/checkbox"
import { Trash } from "@geist-ui/icons"
import { useCallback } from "preact/hooks"
import { useI18n } from "../context/i18n/i18n"
import { useLibrary } from "../context/library/library"
import { useSelection } from "../context/selection"
import { Track } from "../data/track"
import { useDropZone } from "../hooks/useDropZone"


export function Tracks() {
    const i18n = useI18n()
    const { onDrop, remove, tracks } = useLibrary(x => x)

    const { ref, isOver } = useDropZone({ onDrop })
    const { selected, toggle, reset, select } = useSelection()

    const renderTitle = (_: any, track: Track) => track.title ?? <em>{i18n`unknown`}</em>
    const renderArtist = (_: any, track: Track) => track.artist ?? <em>{i18n`unknown`}</em>
    const renderAlbum = (_: any, track: Track) => track.album ?? <em>{i18n`unknown`}</em>

    const renderAction = useCallback((_: any, track: Track) => {
        return (
            <Button type="error" auto scale={1 / 3} font="12px" onClick={() => remove(track)} icon={<Trash />}>
                {i18n`Remove`}
            </Button>
        )
    }, [])

    const renderCheckbox = useCallback((_: any, rowData: Track, idx: number) => {
        return (
            <Checkbox
                onChange={() => toggle(idx)}
                checked={selected.has(idx)} />
        )
    }, [selected])

    if (!tracks.length) {
        return (
            <Card shadow ref={ref} type={isOver ? 'success' : undefined}>
                <Text h4 my={0}>{i18n`Your music files will show up here`}</Text>
                <Text>{i18n`Use the`} <Code>{i18n`Choose Files`}</Code> {i18n`button to pick some files or simply drag-and-drop them on this card`}.</Text>
            </Card>
        )
    }

    return (
        <Table hover data={tracks} ref={ref} type={isOver ? 'success' : undefined}
            onRow={(_: any, idx: number) => toggle(idx)}>
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