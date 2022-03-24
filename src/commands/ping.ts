import { Message, MessageEmbed } from "discord.js";

module.exports = {
	name: "ping",
	description: "Shows bot latency.",
	execute(message: Message) {
		const timeTaken = Date.now() - message.createdTimestamp;
		const embed = new MessageEmbed({
			title: "Pong!",
			color: "#1DB954",
			description: `\`${timeTaken} ms\``,
		});
		message.channel.send({ embeds: [embed] });
	},
};
