import { SlashCommandBuilder } from "@discordjs/builders";
import { Client, Collection } from "discord.js";

export interface Command {
    data: SlashCommandBuilder,
    execute: (...any: any) => void,
}
export type ClientCommands = { commands: Collection<String, Command> };
export type CommandClient = Client & ClientCommands;
