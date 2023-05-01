import { OIDCode } from "../lib/components/OIDCode/OIDCode"
import { useTracks } from "../lib/context/tracks"
import { getFrameData, title } from "../lib/data/id3"
import { type Options, initialOptions } from "../lib/data/options"
import { useGlobalState } from "../lib/hooks/useGlobalState"

export function PrintLayout() {
    const { layout, cols } = useGlobalState<Options>("options", initialOptions)
    const { tracks } = useTracks()

    return (
        <div className="print-only">
            <h1>Lorem Ipsum</h1>
            <table>
                <tbody>
                    {tracks.map(track =>
                        <tr>
                            <td><OIDCode code={10} width={32} height={32} /></td>
                            <td>{title(track)}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}