import { SlashCommandBuilder } from "@discordjs/builders";
import { spotifyGreen } from "colors";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import type { Command } from "types/command";

const embed = new MessageEmbed({
	title: "Pong!",
	color: spotifyGreen,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Show bot latency."),
	async execute(interaction: CommandInteraction) {
		const pingEmbed = embed.setDescription("Pinging...");
		const reply = await interaction.reply({
			embeds: [pingEmbed],
			fetchReply: true,
		}) as Message;

		const timeTaken = reply.createdTimestamp - interaction.createdTimestamp;
		const heartbeat = interaction.client.ws.ping;

		const resultEmbed = embed.setDescription(
			`Roundtrip latency: \`${timeTaken}ms\`\n` +
			`Websocket heartbeat: \`${heartbeat}ms\``);
		interaction.editReply({ embeds: [resultEmbed] });
	},
} as Command;
