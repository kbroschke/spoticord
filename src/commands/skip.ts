import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";

module.exports = {
	name: "skip",
	description: "Skip to next track in queue.",
	execute(message: Message, args: string[], spotifyAPI: SpotifyWebApi) {
		spotifyAPI.skipToNext({ "device_id": DEVICE_ID }).then(
			function() {
				message.react("⏭️");
			},
			function(error) {
				console.error("ERROR: skipToNext", error);
				const embed = new MessageEmbed({
					color: "#f0463a",
					description: "Could not skip to next track.",
				});
				message.channel.send({ embeds: [embed] });
				// TODO catch nothings playing
			},
		);
	},
};
