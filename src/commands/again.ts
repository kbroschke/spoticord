import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
const embed = new MessageEmbed().setColor("#1DB954");

module.exports = {
	name: "again",
	description: "Skip to previously played track.",
	execute(message: Message, args: string[], spotifyAPI: SpotifyWebApi) {
		spotifyAPI.skipToPrevious().then(
			function() {
				message.react("👌");
			},
			function(error) {
				console.error("Skip previous error", error);
				message.channel.send(embed.setDescription("Could not skip to previous track. Please try again later."));
			},
		);
	},
};
