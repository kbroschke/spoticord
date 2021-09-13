"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prefixes = require("../../../config/prefixes.json");
module.exports = {
    name: "message",
    execute(message, client, spotifyAPI, opusStream) {
        // dont react to other Bots
        if (message.author.bot)
            return;
        // get prefix from json values
        let prefix;
        if (message.guild) {
            if (message.guild.id in prefixes) {
                prefix = prefixes[message.guild.id];
            }
            else {
                // default to this prefix
                prefix = "$";
            }
        }
        else {
            // if guild is null then it's a DM
            message.reply("Please send me messages on a server, not private messages.\n" +
                "But here's a neat trick:\n" +
                "You can mention me instead of using a prefix.\n" +
                "Example: To show the currently selected prefix send: ```@[me] prefix```");
            return;
        }
        // extract command and arguments from message
        let commandFull = message.content.trim();
        if (commandFull.startsWith(prefix)) {
            // remove prefix if there
            commandFull = message.content.slice(prefix.length);
        }
        else if (client.user && message.mentions.has(client.user)) {
            // remove mention from front (no regrets :D  -> idea for smarter filter: mentions includes message.author.id )
            commandFull = message.content.slice(client.user.id.length + 4);
        }
        else {
            return;
        }
        // remove possible whitespaces between prefix and command
        commandFull = commandFull.trim();
        // split message into array
        const args = commandFull.split(/ +/);
        // remove command from other arguments
        const command = (args.shift() || "").toLowerCase();
        const commandModule = client.commands.get(command);
        if (!commandModule)
            return;
        try {
            commandModule.execute(message, args, spotifyAPI, opusStream);
        }
        catch (error) {
            console.error(error);
            message.reply("there was an error trying to execute that command!");
        }
    },
};
