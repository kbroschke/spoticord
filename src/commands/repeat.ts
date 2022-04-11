import { CommandInteraction, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";
import emojiCharacters from "../emojiCharacters";
import type { Command } from "types/command";
import { errorRed, spotifyGreen } from "../colors";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("repeat")
		.setDescription("Set repeat mode.")
		.addStringOption((option) => {
			return option
				.setName("mode")
				.setDescription("Set repeat mode to off, track or context.")
				.setRequired(true)
				.addChoice("off", "off")
				.addChoice("track", "track")
				.addChoice("context", "context");
		}),
	execute(interaction: CommandInteraction, spotifyAPI: SpotifyWebApi) {
		type RepeatState = Parameters<SpotifyWebApi["setRepeat"]>[0];

		const repeat = interaction.options.getString("mode", true) as RepeatState;

		spotifyAPI.setRepeat(repeat, { "device_id": DEVICE_ID }).then(
			function() {
				const embed = new MessageEmbed({
					color: spotifyGreen,
					description: emojiCharacters.ok_hand,
				});
				interaction.reply({ embeds: [embed] });
			},
			function(error) {
				// TODO catch nothings playing
				const embed = new MessageEmbed({
					color: errorRed,
				});

				if (error.toString().includes("NO_ACTIVE_DEVICE")) {
					embed.setDescription("Nothing's currently playing.");
				}
				else {
					console.error("ERROR: setRepeat", error);
					embed.setDescription("Repeat mode could not be changed. Please try again later.");
				}
				interaction.reply({ embeds: [embed] });
			},
		);
	},
} as Command;
