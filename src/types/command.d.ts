import { Collection } from "discord.js";

export type ClientCommands = { commands: Collection<String, Command> };
export interface Command {
    name: string,
    description: string,
    execute: (...any: any) => void,
    once?: boolean,
};
