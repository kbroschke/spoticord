/* eslint-disable no-unused-vars */
/* eslint-disable no-var */
import { AudioPlayer } from "@discordjs/voice";
import { ChildProcess } from "child_process";
import { Client } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";

declare global {
    var spotifyAPI: SpotifyWebApi;
    var player: AudioPlayer;
    var librespot: ChildProcess;
    var client: Client;
}

export { };
