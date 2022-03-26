import { AudioPlayer } from "@discordjs/voice";
import { CommandInteraction, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import type { CommandClient } from "types/command";

module.exports = {
	name: "interactionCreate",
	async execute(interaction: CommandInteraction,
		client: CommandClient, spotifyAPI: SpotifyWebApi,
		player: AudioPlayer) {
		if (!interaction.isCommand) {
			return;
		}

		// catch & reply to DMs
		if (!interaction.guild) {
			// TODO move this to every specific command to let everything still work what doesnt need a guild to be executed
			const embed = new MessageEmbed({
				color: "#f0463a",
				description: "This bot only works on servers.",
			});
			interaction.reply({ embeds: [embed] });
			return;
		}

		const command = client.commands.get(interaction.commandName);
		if (!command) {
			// TODO throw error in chat?
			return;
		}

		try {
			command.execute(interaction, spotifyAPI, player);
		}
		catch (error) {
			console.log(
				`ERROR: interactionCreate
				-> command execution failed of command ${command.data.name}`,
				"Interaction: ",
				interaction);
			await interaction.reply({
				content: "There was an error while executing this command!",
				ephemeral: true,
			});
		}
	},
};
