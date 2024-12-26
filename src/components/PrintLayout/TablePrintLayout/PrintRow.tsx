
export function PrintRow(/* { track, dpmm }: { track: Track; dpmm: number } */) {
  // const { colorScheme } = useMantineColorScheme()
  // const fill = colorScheme === 'dark' ? 'white' : 'black'
  // const { oidCodePixelSize, oidCodeResolution } = useSnapshot(optionsPorxy) as TileOptions

  // const backgroundImage = oidCodeDataUrl({ dpmm, code: 10, width: 32, height: 32, fill, dpi: oidCodeResolution, oidCodePixelSize: oidCodePixelSize })

  return (
    <tr>
      {/* <td><OIDCode code={10} width={32} height={32} dpi={dpi} oidCodePixelSize={oidCodePixelSize} /></td> */}
      {/* <td>{track.album}</td> */}
      {/* <td>{track.artist || (<em>{i18n`unknown`}</em>)}</td> */}
      {/* <td>{track.title}</td> */}
    </tr>
  )
  // return (
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
  // )
}
