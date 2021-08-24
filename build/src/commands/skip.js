"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed = new discord_js_1.MessageEmbed().setColor("#1DB954");
module.exports = {
    name: "skip",
    description: "Skip to next track in queue.",
    execute(message, args, spotifyAPI) {
        spotifyAPI.skipToNext().then(function () {
            message.react("👌");
        }, function (error) {
            console.error("--- ERROR SKIPPING TO NEXT TRACK ---", error);
            message.channel.send(embed.setDescription("Could not skip to next track. Please try again later."));
        });
    },
};
