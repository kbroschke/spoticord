const Discord = require('discord.js');
const prefixes = require('../../config/prefixes.json');

const embed = new Discord.MessageEmbed().setColor('#1DB954').setTitle('Command list & explanations');

module.exports = {
	name: 'help',
	description: 'Shows all available commands.',
	execute(message) {
		let prefix;
		if (message.guild.id in prefixes) {
			prefix = prefixes[message.guild.id];
		}
		else {
			prefix = '$';
		}

		if (prefix.length > 3) {
			prefix += ' ';
		}

		message.channel.send(embed.setDescription(
			// ping
			'• `' + prefix + 'ping`\n' +
			'> Shows bot latency.\n' +
			// prefix
			'• `' + prefix + 'prefix`\n' +
			'> Shows current prefix\n' +
			'• `' + prefix + 'prefix <new prefix>`\n' +
			'> \n\n' +
			// now
			'• `' + prefix + 'now`\n' +
			'> Shows info about currently playing track.\n' +
			// play
			'• `' + prefix + 'play`\n' +
			'> Unpauses spotify player.\n' +
			'• `' + prefix + 'play [track|playlist|album|artist] <name>`\n' +
			'> Start playback of given track/playlist/album/artist.\n' +
			// pause
			'• `' + prefix + 'pause`\n' +
			'> Pauses spotify player.\n' +
			// stop || leave
			'• `' + prefix + 'stop` or `' + prefix + 'leave`\n' +
			'> Pauses spotify player and disconnects from voice channel.\n\n' +
			// TODO add modes
			// shuffle
			'• `' + prefix + 'shuffle [mode]`\n' +
			'> Sets shuffle mode. Execute without mode to see all available modes.\n' +
			// repeat
			'• `' + prefix + 'repeat [mode]`\n' +
			'> Sets repeat mode. Execute without mode to see all available modes.\n' +
			// skip
			'• `' + prefix + 'skip`\n' +
			'> Skip to next track in queue.\n' +
			// again
			'• `' + prefix + 'again`\n' +
			'> Skip to previously played track.\n' +
			'',
		));
		// not listed: help, lock, unlock
	},
};