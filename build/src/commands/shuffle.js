"use strict";
const Discord = require('discord.js');
const embed = new Discord.MessageEmbed().setColor('#1DB954');
module.exports = {
    name: 'shuffle',
    description: 'Sets shuffle mode. Possible values are `on` and `off`. If no argument is given it shows all available modes.',
    execute(message, args, spotifyAPI) {
        const modes = ['on', 'off'];
        if (!args.length || !modes.includes(args[0])) {
            message.channel.send(embed.setDescription('Possible arguments: `on` or `off`.'));
            return;
        }
        if (args[0] == 'on') {
            args[0] = true;
        }
        else if (args[0] == 'off') {
            args[0] = false;
        }
        spotifyAPI.setShuffle(args[0]).then(function () {
            message.react('👌');
        }, function (error) {
            if (error.toString().includes('NO_ACTIVE_DEVICE')) {
                message.channel.send(embed.setDescription('Shuffle mode can only be changed when something is playing.'));
            }
            else {
                console.error('--- ERROR SETTING SHUFFLE MODE ---', error);
                message.channel.send(embed.setDescription('Shuffle mode could not be changed. Please try again later.'));
            }
        });
    },
};
