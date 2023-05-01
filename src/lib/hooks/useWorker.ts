import { createWorker, type ICreateWorkerProps } from "typed-web-workers";
import { useGlobalState } from "./useGlobalState";

export function useWorker<Input, Output, State = any>(key: string, props: ICreateWorkerProps<Input, Output, State>) {
    return useGlobalState(`worker:${key}`,
        () => {
            console.log("Creating worker", key)
            return createWorker(props)
        })[0]
}
