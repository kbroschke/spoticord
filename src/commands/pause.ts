import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";

module.exports = {
	name: "pause",
	description: "Pauses Spotify playback.",
	execute(message: Message, args: string[], spotifyAPI: SpotifyWebApi) {
		spotifyAPI.pause({ "device_id": DEVICE_ID }).then(
			function() {
				message.react("⏸️");
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
