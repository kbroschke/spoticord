import { Message, MessageEmbed } from "discord.js";
const embed = new MessageEmbed().setColor("#1DB954").setTitle("Pong!");

module.exports = {
	name: "ping",
	description: "Shows bot latency.",
	execute(message: Message) {
		const timeTaken = Date.now() - message.createdTimestamp;
		message.channel.send(embed.setDescription(`\`${timeTaken} ms\``));
	},
};
