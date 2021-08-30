import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";

const embed = new MessageEmbed().setColor("#1DB954");

module.exports = {
	name: "skip",
	description: "Skip to next track in queue.",
	execute(message: Message, args: string[], spotifyAPI: SpotifyWebApi) {
		spotifyAPI.skipToNext({ "device_id": DEVICE_ID }).then(
			function() {
				message.react("👌");
			},
			function(error) {
				console.error("--- ERROR SKIPPING TO NEXT TRACK ---", error);
				message.channel.send(embed.setDescription("Could not skip to next track. Please try again later."));
			},
		);
	},
};
