import { useRef } from "react";

export type InitRef<T> = () => T;

export function useLazyRef<T>(init: InitRef<T>) {
    const ref = useRef<T | null>(null);
    if (ref.current === null) {
        ref.current = init();
    }

    return ref.current;
}
