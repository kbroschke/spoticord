import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";

module.exports = {
	name: "shuffle",
	description: "Sets shuffle mode. Possible values are `on` and `off`. If no argument is given it shows all available modes.",
	execute(message: Message, args: string[], spotifyAPI: SpotifyWebApi) {
		const modes = ["on", "off"];
		if (!args.length || !modes.includes(args[0])) {
			const embed = new MessageEmbed({
				color: "#f0463a",
				description: "Possible arguments: `on` or `off`.",
			});
			message.channel.send({ embeds: [embed] });
			return;
		}

		let shuffleMode = false;
		if (args[0] === "on") {
			shuffleMode = true;
		}

		spotifyAPI.setShuffle(shuffleMode, { "device_id": DEVICE_ID }).then(
			function() {
				message.react("👌");
			},
			function(error) {
				// TODO catch nothings playing
				let embed = new MessageEmbed({
					color: "#f0463a",
				});
				if (error.toString().includes("NO_ACTIVE_DEVICE")) {
					embed = embed.setDescription("Shuffle mode can only be changed when something is playing.");
					message.channel.send({ embeds: [embed] });
				}
				else {
					console.error("ERROR: setShuffle", error);
					embed = embed.setDescription("Shuffle mode could not be changed.");
					message.channel.send({ embeds: [embed] });
				}
			},
		);
	},
};
