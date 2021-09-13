"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const spotify_json_1 = require("../../config/spotify.json");
const embed = new discord_js_1.MessageEmbed().setColor("#1DB954");
module.exports = {
    name: "shuffle",
    description: "Sets shuffle mode. Possible values are `on` and `off`. If no argument is given it shows all available modes.",
    execute(message, args, spotifyAPI) {
        const modes = ["on", "off"];
        if (!args.length || !modes.includes(args[0])) {
            message.channel.send(embed.setDescription("Possible arguments: `on` or `off`."));
            return;
        }
        let shuffleMode = false;
        if (args[0] === "on") {
            shuffleMode = true;
        }
        spotifyAPI.setShuffle(shuffleMode, { "device_id": spotify_json_1.DEVICE_ID }).then(function () {
            message.react("👌");
        }, function (error) {
            if (error.toString().includes("NO_ACTIVE_DEVICE")) {
                message.channel.send(embed.setDescription("Shuffle mode can only be changed when something is playing."));
            }
            else {
                console.error("--- ERROR SETTING SHUFFLE MODE ---", error);
                message.channel.send(embed.setDescription("Shuffle mode could not be changed. Please try again later."));
            }
        });
    },
};
