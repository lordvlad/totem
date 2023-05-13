import { OIDCode } from "../components/OIDCode/OIDCode"
import { useI18n } from "../i18n/i18n"
import { useLibrary } from "../library/useLibrary"
import { initialPrintOptions, type Options } from "../library/options"
import { useGlobalState } from "../hooks/useGlobalState"

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