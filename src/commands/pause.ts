const Discord = require('discord.js');
const embed = new Discord.MessageEmbed().setColor('#1DB954');

module.exports = {
	name: 'pause',
	description: 'Pauses Spotify playback.',
	execute(message, args, spotifyAPI) {
		spotifyAPI.pause().then(
			function() {
				message.react('⏸️');
			},
			function(error) {
				console.error('--- ERROR PAUSING PLAYBACK ---\n', error);
				message.channel.send(embed.setDescription('Playback could not be paused. Please try again later.'));
			},
		);
	},
};