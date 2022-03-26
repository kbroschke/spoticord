import { SlashCommandBuilder } from "@discordjs/builders";
import { getVoiceConnection } from "@discordjs/voice";
import { CommandInteraction, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";
import { Command } from "types/command";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("stop")
		.setDescription("Disconnect from voice channel and pause spotify playback if neccessary."),
	execute(interaction: CommandInteraction, spotifyAPI: SpotifyWebApi) {
		if (!interaction.guildId) {
			// that we're not a DM is already handeled in the message-event
			return;
		}

		// disconnnect voice channel (if any)
		getVoiceConnection(interaction.guildId)?.destroy();

		const embed = new MessageEmbed({
			color: "#1DB954",
			description: ":wave:",
		});
		interaction.reply({ embeds: [embed], ephemeral: true });

		// TODO remove this in favor of pausing in voiceStateUpdate?
		spotifyAPI.pause({ "device_id": DEVICE_ID }).then(
			function() {
				console.log("Spotify playback paused after `stop`-command.");
			},
			function(error) {
				console.error("ERROR: pause", error);
				const embed = new MessageEmbed({
					color: "#f0463a",
					description: "Playback could not be paused.",
				});
				interaction.reply({ embeds: [embed] });
				// TODO catch nothings playing
			},
		);
	},
} as Command;
