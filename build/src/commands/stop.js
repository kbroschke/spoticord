"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed = new discord_js_1.MessageEmbed().setColor("#1DB954");
module.exports = {
    name: "stop",
    description: "Disconnects from voice channel and pauses spotify playback if neccessary.",
    execute(message, args, spotifyAPI) {
        // that we're not a DM is already handeled in the message-event
        if (!message.guild) {
            return;
        }
        // disconnnect voice channel (if any)
        message.guild.voice?.connection?.disconnect();
        spotifyAPI.pause().then(function () {
            message.react("👋");
        }, function (error) {
            console.error("--- ERROR PAUSING PLAYBACK ---\n", error);
            message.react("👋");
            message.channel.send(embed.setDescription("Spotify playback could not be paused."));
        });
    },
};
