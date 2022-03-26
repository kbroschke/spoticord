import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";
import emojiCharacters from "../emojiCharacters";
import type { Command } from "types/command";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("again")
		.setDescription("Play previously played track again."),
	async execute(interaction: CommandInteraction, spotifyAPI: SpotifyWebApi) {
		spotifyAPI.skipToPrevious({ "device_id": DEVICE_ID }).then(
			function() {
				const embed = new MessageEmbed({
					color: "#1DB954",
					description: emojiCharacters.track_previous,
				});
				interaction.reply({ embeds: [embed] });
			},
			function(error) {
				console.error("Skip previous error", error);
				const embed = new MessageEmbed({
					color: "#f0463a",
					description: "Could not skip to previous track.",
				});
				interaction.reply({ embeds: [embed] });
				// TODO catch nothings playing
			},
		);
	},
} as Command;
