import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
const embed = new MessageEmbed().setColor("#1DB954");

module.exports = {
	name: "pause",
	description: "Pauses Spotify playback.",
	execute(message: Message, args: string[], spotifyAPI: SpotifyWebApi) {
		spotifyAPI.pause().then(
			function() {
				message.react("⏸️");
			},
			function(error) {
				console.error("--- ERROR PAUSING PLAYBACK ---\n", error);
				message.channel.send(embed.setDescription("Playback could not be paused. Please try again later."));
			},
		);
	},
};
