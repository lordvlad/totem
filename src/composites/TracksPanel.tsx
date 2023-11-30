import '@mantine/dropzone/styles.css';

import { Button, Card, Checkbox, Code, Table, Text, Title, Image, ImageProps } from "@mantine/core"
import { Dropzone } from "@mantine/dropzone"
import { useCallback, KeyboardEvent, useState } from "react"
import { Editable } from "../components/Editable/Editable"
import { useI18n } from "../util/i18n/i18n"
import { Track } from "../util/mp3/track"
import { useLibrary } from "../stores/library"
import { useSelection } from "../stores/selection"
import { pd } from "../util/preventDefault"
import Trash from "../components/icons/Trash"

type AlbumArtProps = ImageProps & {
    width?: number;
    height?: number;
    track: Track;
}
export function AlbumArt({ track: { title, art: { mimetype, data } }, ...props }: AlbumArtProps) {
    const url = `data:${mimetype};base64,${btoa(String.fromCharCode(...new Uint8Array(data)))}`
    return <Image src={url} alt={title} {...props} />
}

export function TracksPanel() {
    const { onDrop } = useLibrary(x => x)
    const [isOver, setOver] = useState(false)
    return (
        <Dropzone
            enablePointerEvents={true}
            activateOnClick={false}
            onDragOver={() => setOver(true)}
            onDragLeave={() => setOver(false)}
            onAbort={() => setOver(false)}
            onDrop={items => onDrop(items as unknown as DataTransferItem[])}>
            <TracksPanelInner isOver={isOver} />
        </Dropzone>
    )
}

function TracksPanelInner({ isOver }: { isOver: boolean }) {
    const i18n = useI18n()
    const { remove, tracks, update } = useLibrary(x => x)

    const { selected, toggle, reset, select } = useSelection()

    const onEscape = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        (target.parentElement?.parentElement?.parentElement?.firstChild?.firstChild?.firstChild as HTMLElement).focus();
    }

    const onRowKey = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        try {
            switch (e.key) {
                case "j":
                    (target.parentElement?.parentElement?.parentElement?.parentElement?.nextSibling?.firstChild?.firstChild?.firstChild as HTMLElement).focus();
                    break;
                case "k":
                    (target.parentElement?.parentElement?.parentElement?.parentElement?.previousSibling?.firstChild?.firstChild?.firstChild as HTMLElement).focus();
                    break;
                case "Escape":
                    e.stopPropagation();
                    e.preventDefault();
                    target.blur();
                    return false;
            }
        } catch (err) {
            console.warn(err)
        }
    }

    const renderTitle = (track: Track) =>
        <Editable
            text={track.title}
            placeholder={i18n`unknown`}
            onEscape={onEscape}
            onChange={title => update(Object.assign(track, { title }))} />
    const renderArtist = (track: Track) =>
        <Editable
            text={track.artist}
            placeholder={i18n`unknown`}
            onEscape={onEscape}
            onChange={artist => update(Object.assign(track, { artist }))} />
    const renderAlbum = (track: Track) =>
        <Editable
            text={track.album}
            placeholder={i18n`unknown`}
            onEscape={onEscape}
            onChange={album => update(Object.assign(track, { album }))} />

    const renderAction = useCallback((track: Track) => {
        return (
            <Button color="red" fz="xs" onClick={pd(() => remove(track))} leftSection={<Trash height="12pt" width="12pt" />}>
                {i18n`Remove`}
            </Button>
        )
    }, [])

    const renderCheckbox = useCallback((idx: number) => (
        <Checkbox onKeyDown={onRowKey} onChange={() => toggle(idx)} checked={selected.has(idx)} />
    ), [selected])

    if (!tracks.length) {
        return (
            <Card shadow="md" color={isOver ? 'green' : undefined}>
                <Title order={4} my={0}>{i18n`Your music files will show up here`}</Title>
                <Text>{i18n`Use the`} <Code>{i18n`Choose Files`}</Code> {i18n`button to pick some files or simply drag-and-drop them on this card`}.</Text>
            </Card>
        )
    }

    const label = (<Checkbox
        onChange={(e: any) => {
            if (e.target.checked) {
                select(...tracks.map((_, idx) => idx))
            } else {
                reset()
            }
        }}
    />)

    return (
        <Table highlightOnHover  >
            <thead>
                <tr>
                    <th>{label}</th>
                    <th>{i18n`Cover`}</th>
                    <th>{i18n`Album`}</th>
                    <th>{i18n`Artist`}</th>
                    <th>{i18n`Title`}</th>
                    <th>{i18n`Actions`}</th>
                </tr>
            </thead>
            <tbody>
                {tracks.map((track, idx) => (
                    <tr key={`${track.artist}-${track.album}-${track.title}`}>
                        <td>{renderCheckbox(idx)}</td>
                        <td><AlbumArt height={64} track={track} /></td>
                        <td>{renderAlbum(track)}</td>
                        <td>{renderArtist(track)}</td>
                        <td>{renderTitle(track)}</td>
                        <td>{renderAction(track)}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
    )
}
