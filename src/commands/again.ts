import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";

module.exports = {
	name: "again",
	description: "Skip to previously played track.",
	execute(message: Message, args: string[], spotifyAPI: SpotifyWebApi) {
		spotifyAPI.skipToPrevious({ "device_id": DEVICE_ID }).then(
			function() {
				message.react("⏮️");
			},
			function(error) {
				console.error("Skip previous error", error);
				const embed = new MessageEmbed({
					color: "#f0463a",
					description: "Could not skip to previous track.",
				});
				message.channel.send({ embeds: [embed] });
				// TODO catch nothings playing
			},
		);
	},
};
