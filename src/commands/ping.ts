import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import type { Command } from "types/command";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Show bot latency."),
	execute(interaction: CommandInteraction) {
		const timeTaken = Date.now() - interaction.createdTimestamp;
		const embed = new MessageEmbed({
			title: "Pong!",
			color: "#1DB954",
			description: `\`${timeTaken} ms\``,
		});
		interaction.reply({ embeds: [embed] });
		// TODO fetch reply for two-way latency
	},
} as Command;
