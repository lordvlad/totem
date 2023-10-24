import { Button, Card, Checkbox, Code, Table, Text, Title, Image, ImageProps } from "@mantine/core"
import { useCallback, KeyboardEvent } from "react"
import { Editable } from "../components/Editable"
import { useDropZone } from "../hooks/useDropZone"
import { useI18n } from "../i18n/i18n"
import { Track } from "../library/track"
import { useLibrary } from "../library/useLibrary"
import { useSelection } from "../library/useSelection"
import { pd } from "../util/preventDefault"
import Trash from "../icons/Trash"

export function AlbumArt({ track: { title, art: { mimetype, data } }, ...props }: { track: Track } & ImageProps) {
    const url = `data:${mimetype};base64,${btoa(String.fromCharCode(...new Uint8Array(data)))}`
    return <Image src={url} alt={title} {...props} />
}

export function TracksPanel() {
    const i18n = useI18n()
    const { onDrop, remove, tracks, update } = useLibrary(x => x)

    const { ref, isOver } = useDropZone({ onDrop })
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
            <Button color="red" compact fz="xs" onClick={pd(() => remove(track))} leftIcon={<Trash height="12pt" width="12pt" />}>
                {i18n`Remove`}
            </Button>
        )
    }, [])

    const renderCheckbox = useCallback((idx: number) => (
        <Checkbox onKeyDown={onRowKey} onChange={() => toggle(idx)} checked={selected.has(idx)} />
    ), [selected])

    if (!tracks.length) {
        return (
            <Card shadow="md" ref={ref} color={isOver ? 'green' : undefined}>
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
        <Table highlightOnHover ref={ref} >
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
