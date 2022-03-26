import { CommandInteraction, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";
import type { Command } from "types/command";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("skip")
		.setDescription("Skip to next track in spotify playback."),
	execute(interaction: CommandInteraction, spotifyAPI: SpotifyWebApi) {
		spotifyAPI.skipToNext({ "device_id": DEVICE_ID }).then(
			function() {
				const embed = new MessageEmbed({
					color: "#1DB954",
					description: "⏭️",
				});
				interaction.reply({ embeds: [embed] });
			},
			function(error) {
				console.error("ERROR: skipToNext", error);
				const embed = new MessageEmbed({
					color: "#f0463a",
					description: "Could not skip to next track.",
				});
				interaction.reply({ embeds: [embed] });
				// TODO catch nothings playing
			},
		);
	},
} as Command;
