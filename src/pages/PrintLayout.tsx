import { OIDCode } from "../lib/components/OIDCode/OIDCode"
import { useI18n } from "../lib/context/i18n/i18n"
import { useLibrary } from "../lib/context/library/library"
import { initialOptions, type Options } from "../lib/data/options"
import { useGlobalState } from "../lib/hooks/useGlobalState"

export function PrintLayout() {
    const { tracks } = useLibrary(x => x)
    const i18n = useI18n()

    return (
        <div className="print-only">
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
        </div>
    )
}