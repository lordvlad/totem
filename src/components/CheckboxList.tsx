import { Checkbox, Grid, type GridProps, Spacer } from "@geist-ui/core"
import { type InputHook } from "../hooks/useInput"
import { type CheckboxComponentType } from "@geist-ui/core/esm/checkbox"

export function CheckboxList({ items, ...props }: { items: Record<string, InputHook<boolean>> } & GridProps) {
    return <CheckboxListOfChildren {...props}>
        {Object.entries(items).map(([label, input]) => <Checkbox {...input.bindings}>{label}</Checkbox>)}
    </CheckboxListOfChildren>

}

export function CheckboxListOfChildren({ children, ...props }: { children: CheckboxComponentType[] } & GridProps) {
    return (
        <Grid.Container mt={1.5} {...props}>
            {children.flatMap((child, idx) => {
                const wrapped = <Grid md={24}>{child}</Grid>
                return idx === 0 ? [wrapped] : [<Spacer h={.5} />, wrapped]
            })}
        </Grid.Container>
    )
}