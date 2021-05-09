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
			'> Set\'s new prefix for this server.\n\n' +
			// now
			'• `' + prefix + 'now`\n' +
			'> Shows info about currently playing track.\n' +
			// play
			'• `' + prefix + 'play`\n' +
			'> Unpauses spotify player.\n' +
			'• `' + prefix + 'play <spotify link>`\n' +
			'> Start spotify playback of given link.\n' +
			'• `' + prefix + 'play <name>`\n' +
			'> Search spotify for things with this name.\n' +
			'• `' + prefix + 'play [track|playlist|album|artist] <name>`\n' +
			'> Search spotify for tracks/playlists/albums/artists with this name.\n' +
			// pause
			'• `' + prefix + 'pause`\n' +
			'> Pauses spotify player.\n' +
			// stop || leave
			'• `' + prefix + 'stop`\n' +
			'> Pauses spotify player and disconnects from voice channel.\n\n' +
			// shuffle
			'• `' + prefix + 'shuffle [mode]`\n' +
			'> Sets shuffle mode. Possible modes are `on` and `off`.\n' +
			// repeat
			'• `' + prefix + 'repeat [mode]`\n' +
			'> Sets repeat mode. Possible modes are `track`, `context` and `off`.\n' +
			// skip
			'• `' + prefix + 'skip`\n' +
			'> Skip to next track in queue.\n' +
			// again
			'• `' + prefix + 'again`\n' +
			'> Skip to previously played track. In certain situations this just starts the currently playing track again.\n' +
			'',
		));
		// not listed: help, lock, unlock
	},
};