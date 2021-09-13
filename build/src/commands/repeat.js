"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const spotify_json_1 = require("../../config/spotify.json");
const embed = new discord_js_1.MessageEmbed().setColor("#1DB954");
module.exports = {
    name: "repeat",
    description: "Sets repeat mode. Possible values are `track`, `context` and `off`. If no argument is given it shows all available modes.",
    execute(message, args, spotifyAPI) {
        const modes = ["track", "context", "off"];
        const isOfTypeRepeatState = (userInput) => {
            return modes.includes(userInput);
        };
        if (!args.length || !isOfTypeRepeatState(args[0])) {
            message.channel.send(embed.setDescription("Possible arguments: `track`, `context` or `off`."));
            return;
        }
        spotifyAPI.setRepeat(args[0], { "device_id": spotify_json_1.DEVICE_ID }).then(function () {
            message.react("👌");
        }, function (error) {
            if (error.toString().includes("NO_ACTIVE_DEVICE")) {
                message.channel.send(embed.setDescription("Repeat mode can only be changed when something is playing."));
            }
            else {
                console.error("--- ERROR SETTING REPEAT MODE ---\n", error);
                message.channel.send(embed.setDescription("Repeat mode could not be changed. Please try again later."));
            }
        });
    },
};
