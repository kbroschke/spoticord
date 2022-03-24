import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";

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
			const embed = new MessageEmbed({
				color: "#f0463a",
				description: "Possible arguments: `track`, `context` or `off`.",
			});
			message.channel.send({ embeds: [embed] });
			return;
		}

		spotifyAPI.setRepeat(args[0], { "device_id": DEVICE_ID }).then(
			function() {
				message.react("👌");
			},
			function(error) {
				// TODO catch nothings playing
				const embed = new MessageEmbed({
					color: "#f0463a",
				});
				message.channel.send({ embeds: [embed] });

				if (error.toString().includes("NO_ACTIVE_DEVICE")) {
					embed.setDescription("Nothing's currently playing.");
					message.channel.send({ embeds: [embed] });
				}
				else {
					console.error("ERROR: setRepeat", error);
					embed.setDescription("Repeat mode could not be changed. Please try again later.");
					message.channel.send({ embeds: [embed] });
				}
			},
		);
	},
};
