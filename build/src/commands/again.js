"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed = new discord_js_1.MessageEmbed().setColor("#1DB954");
module.exports = {
    name: "again",
    description: "Skip to previously played track.",
    execute(message, args, spotifyAPI) {
        spotifyAPI.skipToPrevious().then(function () {
            message.react("👌");
        }, function (error) {
            console.error("Skip previous error", error);
            message.channel.send(embed.setDescription("Could not skip to previous track. Please try again later."));
        });
    },
};
