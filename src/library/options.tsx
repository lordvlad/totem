import { ComponentChildren, createContext } from "preact"
import { StateUpdater, useContext } from "preact/hooks"
import { id } from "tsafe/id"
import { useLocalStorageState } from "../hooks/useLocalStorageState"

export const initialPrintOptions = {
    layout: id<'list' | 'tiles' | 'booklet'>('list'),
    cols: 1,
    tileSize: 1,
    featureAlbumControls: false,
    featureAlbumInfo: false,
    featureCover: false,
    featureGeneralControls: false,
    featureTracks: false,
    oidCodeResolution: 1200,
    oidPixelSize: 2,
    paperSize: id<'A4' | 'A4 landscape' | 'letter'>('A4'),
    penLanguage: 'de',
}

export type Options = typeof initialPrintOptions

export const OptionsContext = createContext(id<readonly [Options, StateUpdater<Options>] | undefined>(undefined))

export function LocalStorageOptionsProvider({ children }: { children: ComponentChildren }) {
    const value = useLocalStorageState('options', initialPrintOptions)
    return <OptionsContext.Provider value={value}>{children}</OptionsContext.Provider>
}

export function useOptions() {
    const val = useContext(OptionsContext)
    if (typeof val === "undefined") throw new Error("Option context missing")
    return val
}