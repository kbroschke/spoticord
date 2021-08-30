import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";

const embed = new MessageEmbed().setColor("#1DB954");

module.exports = {
	name: "repeat",
	description: "Sets repeat mode. Possible values are `track`, `context` and `off`. If no argument is given it shows all available modes.",
	execute(message: Message, args: string[], spotifyAPI: SpotifyWebApi) {
		const modes = ["track", "context", "off"];
		type RepeatState = Parameters<SpotifyWebApi["setRepeat"]>[0];

		const isOfTypeRepeatState =
			(userInput: string): userInput is RepeatState => {
				return modes.includes(userInput);
			};

		if (!args.length || !isOfTypeRepeatState(args[0])) {
			message.channel.send(embed.setDescription("Possible arguments: `track`, `context` or `off`."));
			return;
		}

		spotifyAPI.setRepeat(args[0], { "device_id": DEVICE_ID }).then(
			function() {
				message.react("👌");
			},
			function(error) {
				if (error.toString().includes("NO_ACTIVE_DEVICE")) {
					message.channel.send(embed.setDescription("Repeat mode can only be changed when something is playing."));
				}
				else {
					console.error("--- ERROR SETTING REPEAT MODE ---\n", error);
					message.channel.send(embed.setDescription("Repeat mode could not be changed. Please try again later."));
				}
			},
		);
	},
};
