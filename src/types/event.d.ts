export interface Event {
    data: {
        name: string,
        description: string
    },
    execute: (...any: any) => void,
    once: boolean,
};
