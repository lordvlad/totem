import { useRef, useState, useLayoutEffect } from "preact/hooks";

export function Editable({ text, placeholder, onChange }: { text: string; placeholder?: string; onChange: (v: string) => void; }) {
    const [isEditing, setEditing] = useState(false);
    const ref = useRef<HTMLInputElement>();
    const exit = () => {
        setEditing(false);
        const val = ref.current?.value!;
        if (text !== val)
            onChange(val);
    };
    const keyDown = (e: KeyboardEvent) => {
        if (["Enter", "Escape", "Tab"].includes(e.key))
            exit();
    };

    useLayoutEffect(() => ref.current?.select(), [isEditing]);

    return isEditing
        ? (
            <div class="editable" onBlur={() => exit()}>
                <input ref={ref as any} value={text} placeholder={placeholder} onKeyDown={keyDown}></input>
            </div>
        )
        : (
            <div onDblClick={() => setEditing(true)}>
                <span>{text || <em>{placeholder || 'Editable'}</em>}</span>
            </div>
        );
}
