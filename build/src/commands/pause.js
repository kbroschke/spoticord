"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const spotify_json_1 = require("../../config/spotify.json");
const embed = new discord_js_1.MessageEmbed().setColor("#1DB954");
module.exports = {
    name: "pause",
    description: "Pauses Spotify playback.",
    execute(message, args, spotifyAPI) {
        spotifyAPI.pause({ "device_id": spotify_json_1.DEVICE_ID }).then(function () {
            message.react("⏸️");
        }, function (error) {
            console.error("--- ERROR PAUSING PLAYBACK ---\n", error);
            message.channel.send(embed.setDescription("Playback could not be paused. Please try again later."));
        });
    },
};
