export interface Event {
    name: string,
    once?: boolean,
    execute: (...any: any) => void,
}
