import { Checkbox, Grid, type GridProps, Spacer } from "@geist-ui/core"
import { type InputHook } from "../hooks/useInput"
import { type CheckboxComponentType } from "@geist-ui/core/esm/checkbox"
import omit from 'lodash.omit'

export function CheckboxList({ items, ...props }: { items: Record<string, InputHook<boolean>> } & GridProps) {
    // @ts-expect-error
    return <CheckboxListOfChildren {...props}>
        {Object.entries(items).map(([label, input]) => <Checkbox {...omit(input.bindings, 'value')}>{label}</Checkbox>)}
    </CheckboxListOfChildren>

}

export function CheckboxListOfChildren({ children, ...props }: { children: CheckboxComponentType[] } & GridProps) {
    return (
        // @ts-expect-error
        <Grid.Container mt={1.5} {...props}>
            {children.flatMap((child, idx) => {
                const wrapped = <Grid md={24}>{child}</Grid>
                return idx === 0 ? [wrapped] : [<Spacer h={.5} />, wrapped]
            })}
        </Grid.Container>
    )
}