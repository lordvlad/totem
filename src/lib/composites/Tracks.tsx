import { useCallback } from "preact/hooks"
import { Text, Button, Card, Table, Code, Checkbox } from "@geist-ui/core"
import { Trash } from "@geist-ui/icons"
import { useI18n } from "../context/i18n/i18n"
import { useTracks } from "../context/tracks"
import { type FrameId, getFrameData, type ID3 } from "../data/id3"
import { useDropZone } from "../hooks/useDropZone"
import { useSelection } from "../context/selection"
import { type CheckboxEvent } from "@geist-ui/core/esm/checkbox"

function renderFrame(id: FrameId, i18n: ReturnType<typeof useI18n>) {
    return function (_: any, rowData: ID3) {
        const val = getFrameData<string>(rowData, id)
        return typeof val === "undefined" ? <em>{i18n`unknown`}</em> : <>{val}</>
    }
}

export function Tracks() {
    const i18n = useI18n()
    const { tracks, remove, onDrop } = useTracks()
    const { ref, isOver } = useDropZone({ onDrop })
    const { selected, toggle, reset, select } = useSelection()

    const renderTitle = useCallback(renderFrame('TIT2', i18n), [i18n])
    const renderArtist = useCallback(renderFrame('TOA', i18n), [i18n])
    const renderAlbum = useCallback(renderFrame('TALB', i18n), [i18n])

    const renderAction = useCallback((_: any, rowData: ID3) => {
        return (
            <Button type="error" auto scale={1 / 3} font="12px" onClick={() => remove(rowData)} icon={<Trash />}>
                {i18n`Remove`}
            </Button>
        )
    }, [])

    const renderCheckbox = useCallback((_: any, rowData: ID3, idx: number) => {
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