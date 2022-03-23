/* eslint-disable no-unused-vars */
/* eslint-disable no-var */
import { AudioPlayer } from "@discordjs/voice";
import { ChildProcessWithoutNullStreams } from "child_process";
import { Client } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { ClientCommands } from "./command";

declare global {
    var spotifyAPI: SpotifyWebApi;
    var player: AudioPlayer;
    var librespot: ChildProcessWithoutNullStreams;
    var client: Client & ClientCommands;
}

export { };
