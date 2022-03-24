import { Client, Collection } from "discord.js";

export interface Command {
    name: string,
    description: string,
    execute: (...any: any) => void,
    once?: boolean,
};
export type ClientCommands = { commands: Collection<String, Command> };
export type CommandClient = Client & ClientCommands;
