import { useEffect, useState } from "react";
import "./App.css";
import { useLazyRef } from "./hooks/useLazyRef";
import { Lucio } from "./lucio/lucio";

type CallbackRef = (element: HTMLElement | null) => void;

export const useLucio = (): CallbackRef => {
    const lucio = useLazyRef(() => new Lucio());

    useEffect(() => {
        lucio.start();

        return () => lucio.dispose();
    }, [lucio]);

    const callbackRef = (element: HTMLElement | null): void => {
        if (element !== null) {
            element.appendChild(lucio.domElement);
        }
    };

    return callbackRef;
};

const LucioComponent: React.VFC = () => {
    const ref = useLucio();

    return <div className="lucio-container" ref={ref} />;
};

export const App: React.VFC = () => {
    const [isRunning, setIsRunning] = useState(false);

    const onClick = () => {
        setIsRunning(true);
    };

    return (
        <div className="App">
            {isRunning ? <LucioComponent /> : <button onClick={onClick}>start</button>}
        </div>
    );
};
