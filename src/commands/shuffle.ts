import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";
import type { Command } from "types/command";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("shuffle")
		.setDescription("Set shuffle mode.")
		.addStringOption((option) => {
			return option
				.setName("mode")
				.setDescription("Turn shuffle on or off.")
				.setRequired(true)
				.addChoice("on", "on")
				.addChoice("off", "off");
		}),
	execute(interaction: CommandInteraction, spotifyAPI: SpotifyWebApi) {
		const shuffle = interaction.options.getString("mode", true);
		const shuffleMode = shuffle === "on";

		spotifyAPI.setShuffle(shuffleMode, { "device_id": DEVICE_ID }).then(
			function() {
				const embed = new MessageEmbed({
					color: "#1DB954",
					description: ":ok_hand:",
				});
				interaction.reply({ embeds: [embed] });
			},
			function(error) {
				// TODO catch nothings playing
				let embed = new MessageEmbed({
					color: "#f0463a",
				});
				if (error.toString().includes("NO_ACTIVE_DEVICE")) {
					embed = embed.setDescription("Shuffle mode can only be changed when something is playing.");
					interaction.reply({ embeds: [embed] });
				}
				else {
					console.error("ERROR: setShuffle", error);
					embed = embed.setDescription("Shuffle mode could not be changed.");
					interaction.reply({ embeds: [embed] });
				}
			},
		);
	},
} as Command;
