import { useRef, useState, useEffect, useCallback, KeyboardEvent } from "react";

function setCaret(el: Node, pos = 0, end?: number) {
    const range = document.createRange()

    range.setStart(el, pos)

    try {
        if (typeof end !== "undefined") range.setEnd(el, end)
        else range.collapse(true)
    } catch (e) {
        range.collapse(true)
    }

    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)
}

type EditableProps = {
    text: string;
    placeholder: string;
    onChange: (v: string) => void;
    tabbable?: boolean;
    tabIndex?: number;
    onEscape?: (e: KeyboardEvent) => void;
};

export function Editable({
    text,
    placeholder,
    onChange,
    tabIndex,
    tabbable = true,
    onEscape,
}: EditableProps) {
    const [isFocused, setIsFocused] = useState(false)
    const ref = useRef<HTMLElement>();
    const exit = useCallback(() => {
        const val = ref.current?.innerText!;
        if (text !== val)
            onChange(val);
        setIsFocused(false)
        window.getSelection()?.removeAllRanges()
    }, [text, onChange]);

    useEffect(() => {
        if (isFocused && ref.current && ref.current.childNodes.length) {
            setCaret(ref.current.childNodes[0], 0, ref.current.childNodes[0].textContent?.length);
        }
    }, [isFocused, ref.current])

    const keyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
        if (isFocused && ["Enter", "Escape"].includes(e.key)) {
            e.preventDefault()
            e.stopPropagation()
            ref.current?.blur()

            if (e.key === "Escape" && onEscape) onEscape(e)
        }
    }, [onEscape, isFocused]);

    return (
        <div
            contentEditable
            tabIndex={tabIndex ?? (tabbable ? 0 : undefined)}
            onKeyDown={keyDown}
            onBlur={exit}
            onFocus={() => setIsFocused(true)}
            ref={ref as any}
            dangerouslySetInnerHTML={{ __html: isFocused ? text : (text || `<em>${placeholder}</em>`) }}
        >
        </div>
    )
}
