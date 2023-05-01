
export const initialOptions = {
    layout: 'list' as ('list' | 'tiles' | 'booklet'),
    cols: 1,
    tileSize: 1,
    featureAlbumControls: false,
    featureAlbumInfo: false,
    featureCover: false,
    featureGeneralControls: false,
    featureTracks: false,
    oidCodeResolution: 1200,
    oidPixelSize: 2,
    paperSize: 'A4' as ('A4' | 'A4 landscape' | 'letter'),
    penLanguage: 'de',
}

export type Options = typeof initialOptions
