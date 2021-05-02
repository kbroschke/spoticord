const Discord = require('discord.js');
const embed = new Discord.MessageEmbed().setColor('#1DB954').setTitle('Pong!');

module.exports = {
	name: 'ping',
	description: 'Shows bot latency.',
	execute(message) {
		const timeTaken = Date.now() - message.createdTimestamp;
		message.channel.send(embed.setDescription(`\`${timeTaken} ms\``));
	},
};