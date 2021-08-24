"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed = new discord_js_1.MessageEmbed().setColor("#1DB954").setTitle("Pong!");
module.exports = {
    name: "ping",
    description: "Shows bot latency.",
    execute(message) {
        const timeTaken = Date.now() - message.createdTimestamp;
        message.channel.send(embed.setDescription(`\`${timeTaken} ms\``));
    },
};
