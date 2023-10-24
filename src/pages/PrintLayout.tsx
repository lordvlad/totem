import { Box, Card, ColorSchemeProvider, Grid, MantineProvider, Sx, Text, Title, useMantineColorScheme } from "@mantine/core"
import { assert, is } from "tsafe"
import { oidCodeDataUrl } from "../components/OIDCode/OIDCode"
// import { OIDCode, oidCodeDataUrl } from "../components/OIDCode/OIDCode"
// import { useI18n } from "../i18n/i18n"
import { Options, TableOptions, TileOptions, useOptions } from "../library/options"
import { useLibrary } from "../library/useLibrary"
import { Track } from "../library/track"
import { AlbumArt } from "../composites/TracksPanel"

function PrintRow(/* { track, dpmm }: { track: Track; dpmm: number }*/) {
    // const { colorScheme } = useMantineColorScheme()
    // const fill = colorScheme === 'dark' ? 'white' : 'black'
    // const { oidCodePixelSize, oidCodeResolution } = useOptions()[0] as TileOptions

    // const backgroundImage = oidCodeDataUrl({ dpmm, code: 10, width: 32, height: 32, fill, dpi: oidCodeResolution, oidCodePixelSize: oidCodePixelSize })

    return (
        <tr>
            {/* <td><OIDCode code={10} width={32} height={32} dpi={dpi} oidCodePixelSize={oidCodePixelSize} /></td> */}
            {/* <td>{track.album}</td> */}
            {/* <td>{track.artist || (<em>{i18n`unknown`}</em>)}</td> */}
            {/* <td>{track.title}</td> */}
        </tr>
    )
    //return (
    //    <tr key={`${track.artist}${track.album}${track.title}`} sx={{ backgroundImage: `url(${backgroundImage})` }}>
    //         <td>
    //             <Box display="inline-block" w={64}>
    //                 <AlbumArt track={track} />
    //             </Box>
    //             <Box display="inline-block" ml="md">
    //                 <Title order={4} sx={{ textTransform: 'uppercase', textOverflow: 'ellipsis' }}>{track.title}</Title>
    //                 <Text>{track.album}</Text>
    //                 <Text>{track.artist}</Text>
    //             </Box>
    //         </td>
    //     </tr>
    //)

}

function PrintTile({ track, dpmm }: { track: Track; dpmm: number }) {
    const { colorScheme } = useMantineColorScheme()
    const fill = colorScheme === 'dark' ? 'white' : 'black'
    const { oidCodePixelSize, oidCodeResolution } = useOptions()[0] as TileOptions

    const backgroundImage = oidCodeDataUrl({ dpmm, code: 10, width: 32, height: 32, fill, dpi: oidCodeResolution, oidCodePixelSize: oidCodePixelSize })

    return (
        <Card key={`${track.artist}${track.album}${track.title}`} >
            <Card.Section>
                <Box style={{ zIndex: 999, position: 'absolute', bottom: 0, right: 0, left: 0, top: 0, backgroundImage: `url(${backgroundImage})` }} />
            </Card.Section>
            <Card.Section><AlbumArt track={track} /></Card.Section>
            <Title order={4} sx={{ textTransform: 'uppercase', textOverflow: 'ellipsis' }}>{track.title}</Title>
            <Text>{track.album}</Text>
            <Text>{track.artist}</Text>
        </Card>
    )
}

export function TilePrintLayout() {
    const [options, _] = useOptions()

    assert(is<TileOptions>(options))

    const { oidCodeResolution } = options
    const dpmm = oidCodeResolution * 0.039370079

    const { tracks } = useLibrary(x => x)

    return (
        <Grid gutter={4}>
            {tracks.map(track =>
                <Grid.Col key={`${track.artist}${track.album}${track.title}`} span={12}>
                    <PrintTile track={track} dpmm={dpmm} />
                </Grid.Col>
            )}

        </Grid>
    )

}

export function TablePrintLayout() {
    const { tracks } = useLibrary(x => x)
    const [options, _] = useOptions()
    assert(is<TableOptions>(options))

    // const { oidCodeResolution } = options
    // const dpmm = oidCodeResolution * 0.039370079

    return (
        <table>
            <tbody>
                {/* {tracks.map(track => <PrintRow track={track} dpmm={dpmm} />)} */}
                {tracks.map(() => <PrintRow />)}
            </tbody>
        </table>
    )

}

const paperDimensions: Record<Options['paperSize'], { height: string, width: string }> = {
    "A4": { height: "29.7cm", width: "21cm" },
    "A4 landscape": { height: "21cm", width: "29.7cm" },
    letter: { height: "27.9cm", width: "21.6cm" }
}

export function PrintPreview() {
    const { colorScheme } = useMantineColorScheme()
    const { layout, paperSize } = useOptions()[0]

    const sx: Sx = {
        borderColor: colorScheme === 'dark' ? 'white' : 'black',
        borderWidth: '1px',
        borderStyle: 'solid',
        ...paperDimensions[paperSize],
    }

    return <Box sx={sx}>{(() => {
        switch (layout) {
            case "tiles": return <TilePrintLayout />
            case "table": return <TablePrintLayout />
        }
    })()}</Box>
}

export function PrintLayout() {
    const { layout } = useOptions()[0]

    return (
        <ColorSchemeProvider colorScheme="light" toggleColorScheme={_ => void 0} >
            <MantineProvider theme={{ colorScheme: 'light' }} >
                <Box className="print-only">{(() => {
                    switch (layout) {
                        case "tiles": return <TilePrintLayout />
                        case "table": return <TablePrintLayout />
                    }
                })()}</Box>
            </MantineProvider>
        </ColorSchemeProvider >
    )
}