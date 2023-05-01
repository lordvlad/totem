import { OIDCode } from "../lib/components/OIDCode/OIDCode"
import { useLibrary } from "../lib/context/library/library"
import { initialOptions, type Options } from "../lib/data/options"
import { useGlobalState } from "../lib/hooks/useGlobalState"

export function PrintLayout() {
    const { layout, cols } = useGlobalState<Options>("options", initialOptions)
    const { tracks } = useLibrary(x => x)

    return (
        <div className="print-only">
            <h1>Lorem Ipsum</h1>
            <table>
                <tbody>
                    {tracks.map(track =>
                        <tr>
                            <td><OIDCode code={10} width={32} height={32} /></td>
                            <td>{track.title}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}