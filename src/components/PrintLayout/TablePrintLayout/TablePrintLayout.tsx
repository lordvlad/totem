import { assert, is } from "tsafe/assert"
import { useLibrary } from "../../../hooks/useLibrary"
import { type TableOptions, useOptions } from "../../../hooks/useOptions"
import { PrintRow } from "./PrintRow"

export function TablePrintLayout() {
  const { value: tracks } = useLibrary('tracks')
  const options = useOptions()[0]
  assert(is<TableOptions>(options))

  return (
    <table>
      <tbody>
        {tracks.map(({ fileName }) => <PrintRow key={fileName} />)}
      </tbody>
    </table>
  )
}
