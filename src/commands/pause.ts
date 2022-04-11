import { CommandInteraction, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";
import emojiCharacters from "../emojiCharacters";
import type { Command } from "types/command";
import { errorRed, spotifyGreen } from "../colors";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("pause")
		.setDescription("Pause spotify playback."),
	execute(interaction: CommandInteraction, spotifyAPI: SpotifyWebApi) {
		spotifyAPI.pause({ "device_id": DEVICE_ID }).then(
			function() {
				const embed = new MessageEmbed({
					color: spotifyGreen,
					description: emojiCharacters.pause,
				});
				interaction.reply({ embeds: [embed] });
			},
			function(error) {
				console.error("ERROR: pause", error);
				const embed = new MessageEmbed({
					color: errorRed,
					description: "Playback could not be paused.",
				});
				interaction.reply({ embeds: [embed] });
				// TODO catch nothings playing
			},
		);
	},
} as Command;
