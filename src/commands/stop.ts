import { getVoiceConnection } from "@discordjs/voice";
import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";

module.exports = {
	name: "stop",
	description: "Disconnects from voice channel and pauses spotify playback if neccessary.",
	execute(message: Message, args: string[], spotifyAPI: SpotifyWebApi) {
		if (!message.guildId) {
			// that we're not a DM is already handeled in the message-event
			return;
		}

		// disconnnect voice channel (if any)
		getVoiceConnection(message.guildId)?.destroy();

		message.react("👋");

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
				message.channel.send({ embeds: [embed] });
				// TODO catch nothings playing
			},
		);
	},
};
