import { ChildProcessWithoutNullStreams } from "child_process";
import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";

const embed = new MessageEmbed().setColor("#1DB954");

module.exports = {
	name: "pause",
	description: "Pauses Spotify playback.",
	execute(message: Message, args: string[], spotifyAPI: SpotifyWebApi,
		librespot: ChildProcessWithoutNullStreams) {
		spotifyAPI.pause({ "device_id": DEVICE_ID }).then(
			function() {
				message.react("⏸️");
				// librespot.stdout.pause();
			},
			function(error) {
				console.error("--- ERROR PAUSING PLAYBACK ---\n", error);
				message.channel.send(embed.setDescription("Playback could not be paused. Please try again later."));
			},
		);
	},
};
