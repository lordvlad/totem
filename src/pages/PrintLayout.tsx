import { Card, Grid, Text, Title } from "@mantine/core"
import { assert, is } from "tsafe"
import { OIDCode, oidCodeDataUrl } from "../components/OIDCode/OIDCode"
import { useI18n } from "../i18n/i18n"
import { TileOptions, useOptions } from "../library/options"
import { useLibrary } from "../library/useLibrary"
import { Track } from "../library/track"

function PrintTile({ track, dpmm }: { track: Track; dpmm: number }) {
    const i18n = useI18n()

    return (<Card style={{ width: 100, backgroundImage: oidCodeDataUrl({ dpmm, code: 10, width: 32, height: 32 }) }}>
        {/* <OIDCode code={10} width={32} height={32} /> */}
        <Title order={4} style={{ textTransform: 'uppercase' }}>{track.title}</Title>
        <Text>{track.album}</Text>
        <Text>{track.artist || (<em>{i18n`unknown`}</em>)}</Text>
    </Card>)

}

export function TilePrintLayout() {
    const [options, _] = useOptions()

    assert(is<TileOptions>(options))

    const { cols, oidCodeResolution } = options
    const dpmm = oidCodeResolution * 0.039370079

    const { tracks } = useLibrary(x => x)

    return (
        <Grid gutter={4}>
            {tracks.map(track =>
                <Grid.Col span={12 / cols}>
                    <PrintTile track={track} dpmm={dpmm} />
                </Grid.Col>
            )}

        </Grid>
    )

}

export function TablePrintLayout() {
    const { tracks } = useLibrary(x => x)
    const i18n = useI18n()
    return (
        <>
            <h1>Lorem Ipsum</h1>
            <table>
                <tbody>
                    {tracks.map(track =>
                        <tr>
                            <td><OIDCode code={10} width={32} height={32} /></td>
                            <td>{track.album}</td>
                            <td>{track.artist || (<em>{i18n`unknown`}</em>)}</td>
                            <td>{track.title}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </>
    )

}

export function PrintLayout() {
    const [{ layout }, _] = useOptions()
    const inner = (() => {
        switch (layout) {
            case "tiles": return <TilePrintLayout />
            case "table": return <TablePrintLayout />
        }
    })();

    return <div className="print-only" > {inner} </div>

}