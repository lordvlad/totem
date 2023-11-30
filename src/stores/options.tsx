import { useLocalStorage } from "@mantine/hooks"
import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useState, useCallback } from "react"
import { id } from "tsafe/id"

const initialCommonOptions = {
    oidCodeResolution: 1200,
    oidCodePixelSize: 2,
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
    tileSize: 1,
}

const initialTableOptions = {
    layout: 'table' as (typeof initialCommonOptions)['layout'],
}

type CommonOptions = typeof initialCommonOptions
export type TileOptions = CommonOptions & (typeof initialTileOptions)
export type TableOptions = CommonOptions & (typeof initialTableOptions)


export type Options = TableOptions | TileOptions

export const initialPrintOptions = id<Options>({
    ...initialTileOptions,
    ...initialCommonOptions,
})


export const OptionsContext = createContext(id<readonly [Options, Dispatch<SetStateAction<Options>>] | undefined>(undefined))

export function LocalStorageOptionsProvider({ children }: { children: ReactNode }) {
    const [opt, setOpt] = useLocalStorage({ key: 'options', defaultValue: initialPrintOptions })
    return <OptionsContext.Provider value={[opt||initialPrintOptions, setOpt]}>{children}</OptionsContext.Provider>
}

export function useOptions() {
    const val = useContext(OptionsContext)
    if (typeof val === "undefined") throw new Error("Option context missing")
    return val
}

const state = { open: false }
const listeners = new Set<Dispatch<SetStateAction<boolean>>>()

export function useOptionsPanel() {
    const [s, _setS] = useState(state.open)

    useEffect(() => {
        listeners.add(_setS)
        return () => { listeners.delete(_setS) }
    }, [])

    const setS: Dispatch<SetStateAction<boolean>> = useCallback((n: SetStateAction<boolean>) => {
        const v = state.open= typeof n === 'function' ? n(state.open) : n
        listeners.forEach(l => l(v))
    }, [])

    return [s, setS] as const
}