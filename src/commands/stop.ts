import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";

const embed = new MessageEmbed().setColor("#1DB954");

module.exports = {
	name: "stop",
	description: "Disconnects from voice channel and pauses spotify playback if neccessary.",
	execute(message: Message, args: string[], spotifyAPI: SpotifyWebApi) {
		// that we're not a DM is already handeled in the message-event
		if (!message.guild) {return;}

		// disconnnect voice channel (if any)
		message.guild.voice?.connection?.disconnect();

		spotifyAPI.pause({ "device_id": DEVICE_ID }).then(
			function() {
				message.react("👋");
			},
			function(error) {
				console.error("--- ERROR PAUSING PLAYBACK ---\n", error);
				message.react("👋");
				message.channel.send(embed.setDescription("Spotify playback could not be paused."));
			},
		);
	},
};
