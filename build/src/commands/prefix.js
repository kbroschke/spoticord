"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const embed = new discord_js_1.MessageEmbed().setColor("#1DB954");
module.exports = {
    name: "prefix",
    description: "Sets new prefix. If no argument is given it shows the current prefix.",
    execute(message, args) {
        // message-event already performs check that we're not a DM
        if (!message.guild) {
            return;
        }
        let prefixes;
        try {
            prefixes = JSON.parse(fs_1.readFileSync("../../config/prefixes.json").toString());
        }
        catch (error) {
            console.error(error);
            return;
        }
        let prefix;
        if (message.guild.id in prefixes) {
            prefix = prefixes[message.guild.id];
        }
        else {
            prefix = "$";
        }
        if (args.length === 0) {
            message.channel.send(embed.setDescription(`Current command prefix is \`${prefix}\``));
            return;
        }
        if (message.member && !message.member.hasPermission("ADMINISTRATOR")) {
            message.reply("sorry but you're not an administrator.");
            return;
        }
        prefix = args.join(" ");
        prefixes[message.guild.id] = prefix;
        try {
            fs_1.writeFileSync("../../config/prefixes.json", JSON.stringify(prefixes, null, 4));
        }
        catch (error) {
            console.error("--- FS WRITE ERROR ---", error);
            message.channel.send("Sorry! There was an internal error!");
        }
        message.channel.send(embed.setDescription(`Command prefix set to \`${prefix}\``));
    },
};
