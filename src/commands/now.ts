import { SlashCommandBuilder } from "@discordjs/builders";
import { errorRed, spotifyGreen } from "colors";
import { CommandInteraction, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import type { Command } from "types/command";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("now")
		.setDescription("Show currently playing track."),
	execute(interaction: CommandInteraction, spotifyAPI: SpotifyWebApi) {
		spotifyAPI.getMyCurrentPlayingTrack().then(
			function(data) {
				const item = data.body.item;
				if (item) {
					const song = item.name;

					let itemContext:
						SpotifyApi.AlbumObjectSimplified |
						SpotifyApi.ShowObjectSimplified;
					let creatorList: string;

					if (item.type === "track") {
						itemContext = item.album;

						const artists = item.artists;
						creatorList = artists[0].name;
						for (let i = 1; i < artists.length; i++) {
							creatorList += ", " + artists[i].name;
						}
					}
					else {
						itemContext = item.show;

						creatorList = itemContext.publisher;
					}

					const contextName = itemContext.name;

					const coverIMG = itemContext.images[0].url;
					const urlSong = item.external_urls.spotify;

					const progressInMS = data.body.progress_ms || 0;
					const progress = msToMMSS(progressInMS);
					const progressMin = progress[0];
					const progressSec = progress[1];

					const totalDurationInMS = item.duration_ms;
					const total = msToMMSS(totalDurationInMS);
					const totalMin = total[0];
					const totalSec = total[1];

					const position = Math.round(
						(10 * progressInMS) / totalDurationInMS);

					let timeBar = "[";
					for (let i = 1; i < position; i++) {
						timeBar += "▬";
					}
					timeBar += "](https://www.youtube.com/watch?v=dQw4w9WgXcQ):radio_button:";
					for (let i = position + 1; i < 11; i++) {
						timeBar += "▬";
					}

					const embed = new MessageEmbed({
						title: song,
						color: spotifyGreen,
						description:
							`by ${creatorList}\n` +
							`from ${contextName}\n\n` +
							`${progressMin}:${progressSec}`+
							`\u2002${timeBar}\u2002`+
							`${totalMin}:${totalSec}`,
						url: urlSong,
					}).setThumbnail(coverIMG);

					interaction.reply({ embeds: [embed] });
				}
				else {
					sendNothingsPlaying(interaction);
				}
			}, function(error) {
				console.error("ERROR: getMyCurrentPlayingTrack", error);
				sendNothingsPlaying(interaction);
			},
		);
	},
} as Command;

/**
 * Converts number in milliseconds into respectable pair of minutes and seconds
 * @param {number} progressMS - number in milliseconds
 * @return {string[]} Array of minutes and seconds as strings
 */
function msToMMSS(progressMS: number): string[] {
	let progressInS = Math.floor(progressMS / 1_000);
	const progressInM = Math.floor(progressInS / 60);
	progressInS = progressInS % 60;

	const progressStringInM = progressInM.toString();
	const progressStringInS = progressInS.toString();
	return [
		(progressStringInM.length < 2 ? "0" : "") + progressStringInM,
		(progressStringInS.length < 2 ? "0" : "") + progressStringInS,
	];
}

/**
 * Send message that nothing is currently playing
 * @param {CommandInteraction} interaction - Send response as reply to command
 */
function sendNothingsPlaying(interaction: CommandInteraction) {
	const embed = new MessageEmbed({
		color: errorRed,
		description: "Nothing's currently playing.",
	});
	interaction.reply({ embeds: [embed] });
	// TODO catch nothings playing
}
