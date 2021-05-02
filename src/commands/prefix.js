const fs = require('fs');
const Discord = require('discord.js');
const prefixes = require('../../config/prefixes.json');

const embed = new Discord.MessageEmbed().setColor('#1DB954');

module.exports = {
	name: 'prefix',
	description: 'Sets new prefix. If no argument is given it shows the current prefix.',
	execute(message, args) {
		let prefix;
		if (message.guild.id in prefixes) {
			prefix = prefixes[message.guild.id];
		}
		else {
			prefix = '$';
		}

		if (!args.length) {
			message.channel.send(embed.setDescription(`Current command prefix is \`${prefix}\``));
		}
		else if(!message.member.hasPermission('ADMINISTRATOR')) {
			message.reply('sorry but you\'re not an administrator.');
		}
		else {
			prefix = args.join(' ');
			prefixes[message.guild.id] = prefix;
			fs.writeFile('../../config/prefixes.json', JSON.stringify(prefixes, null, 4), error => {
				if (error) {
					console.error('--- FS WRITE ERROR ---', error);
					message.channel.send('Sorry! There was an internal error!');
				}
				else {message.channel.send(embed.setDescription(`Command prefix set to \`${prefix}\``));}
			});
		}
	},
};