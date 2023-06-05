import { Radio, RadioGroupProps } from '@geist-ui/core';
import { type InputHook } from '../hooks/useInput.js';


export function RadioGroup<T extends string | number>({ input, items, ...props }: { input: InputHook<T>; items: Record<T, string>; } & RadioGroupProps) {
    return (
        // @ts-expect-error
        <Radio.Group {...input.bindings} {...props}>
            {Object.entries(items as Record<string | number, string>).map(([value, label]) => <Radio value={value}>{label}</Radio>)}
        </Radio.Group>
    );
}
