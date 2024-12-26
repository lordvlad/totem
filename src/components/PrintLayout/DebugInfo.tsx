import { useOptions } from "../../hooks/useOptions"

export function DebugInfo() {
  const { debug, ...options } = useOptions()[0]
  if (!debug) return null
  return (
    <pre style={{ fontSize: '8pt' }}>
      {JSON.stringify(options, null, 2)}
    </pre>
  )
}
