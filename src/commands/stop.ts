const Discord = require('discord.js');
const embed = new Discord.MessageEmbed().setColor('#1DB954');

module.exports = {
	name: 'stop',
	description: 'Disconnects from voice channel and pauses spotify playback if neccessary.',
	execute(message, args, spotifyAPI) {
		if (message.guild.voice) {
			message.guild.voice.connection.disconnect();
		}
		spotifyAPI.pause().then(
			function() {
				message.react('👋');
			},
			function(error) {
				console.error('--- ERROR PAUSING PLAYBACK ---\n', error);
				message.channel.send(embed.setDescription('Playback could not be paused. Please try again later.'));
			},
		);
	},
};