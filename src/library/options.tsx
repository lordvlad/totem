import { ReactNode, createContext, useContext, Dispatch, SetStateAction } from "react"
import { id } from "tsafe/id"
import { useLocalStorageState } from "../hooks/useLocalStorageState"

const initialCommonOptions = {
    oidCodeResolution: 1200,
    oidPixelSize: 2,
    paperSize: id<'A4' | 'A4 landscape' | 'letter'>('A4'),
    penLanguage: 'de',

    // FIXME check if this should be moved into tile or table options
    featureAlbumControls: false,
    featureAlbumInfo: false,
    featureCover: false,
    featureGeneralControls: false,
    featureTracks: false,
    layout: id<'tiles' | 'table'>('tiles')
}

const initialTileOptions = {
    layout: 'tiles' as (typeof initialCommonOptions)['layout'],
    cols: 1,
    tileSize: 1,
}

const initialTableOptions = {
    layout: 'table' as (typeof initialCommonOptions)['layout'],
}

type CommonOptions = typeof initialCommonOptions
export type TileOptions = typeof initialTileOptions
export type TableOptions = typeof initialTableOptions


export type Options = CommonOptions & (TableOptions | TileOptions)

export const initialPrintOptions = id<Options>({
    ...initialTileOptions,
    ...initialCommonOptions,
})


export const OptionsContext = createContext(id<readonly [Options, Dispatch<SetStateAction<Options>>] | undefined>(undefined))

export function LocalStorageOptionsProvider({ children }: { children: ReactNode }) {
    const value = useLocalStorageState('options', initialPrintOptions)
    return <OptionsContext.Provider value={value}>{children}</OptionsContext.Provider>
}

export function useOptions() {
    const val = useContext(OptionsContext)
    if (typeof val === "undefined") throw new Error("Option context missing")
    return val
}