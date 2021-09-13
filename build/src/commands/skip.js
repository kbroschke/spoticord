"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const spotify_json_1 = require("../../config/spotify.json");
const embed = new discord_js_1.MessageEmbed().setColor("#1DB954");
module.exports = {
    name: "skip",
    description: "Skip to next track in queue.",
    execute(message, args, spotifyAPI) {
        spotifyAPI.skipToNext({ "device_id": spotify_json_1.DEVICE_ID }).then(function () {
            message.react("👌");
        }, function (error) {
            console.error("--- ERROR SKIPPING TO NEXT TRACK ---", error);
            message.channel.send(embed.setDescription("Could not skip to next track. Please try again later."));
        });
    },
};
