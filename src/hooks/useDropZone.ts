import { useCallback, useEffect, useRef, useState } from "react"

export function useDropZone({ onDrop }: { onDrop: (files: DataTransferItem[]) => void }) {
    // FIXME fix this any
    const ref = useRef<any>(undefined)
    const [isOver, setIsOver] = useState(false)

    const onDragEnter = useCallback((e: DragEvent) => {
        setIsOver(ref.current?.base?.contains(e.target as Node))
    }, [])

    const onDragLeave = useCallback(() => {
        // console.log("leave", ref.current?.base, e.target)
        // if (ref.current?.base?.contains(e.target as Node))
        // setIsOver(false)
    }, [])

    const onDragOver = useCallback((e: DragEvent) => {
        if (ref.current?.base?.contains(e.target as Node))
            e.preventDefault()
    }, [])

    const onDropPrivate = useCallback((e: DragEvent) => {
        if (ref.current?.base?.contains(e.target as Node)) {
            e.preventDefault()
            setIsOver(false)
            onDrop([...(e.dataTransfer?.items || [])])
        }
    }, [])

    useEffect(() => {
        document.addEventListener("dragover", onDragOver, false)
        document.addEventListener("drop", onDropPrivate, false)
        document.addEventListener("dragenter", onDragEnter, false)
        document.addEventListener("dragleave", onDragLeave, false)
        return () => {
            document.removeEventListener("dragover", onDragOver)
            document.removeEventListener("drop", onDropPrivate)
            document.removeEventListener("dragenter", onDragEnter)
            document.removeEventListener("dragleave", onDragLeave)
        }
    }, [ref])

    return { ref, isOver }
}