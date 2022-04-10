import { CommandInteraction, Guild, GuildMember, Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";
import { AudioPlayer, getVoiceConnection, VoiceConnection } from "@discordjs/voice";
import type { Command } from "types/command";
import { SlashCommandBuilder } from "@discordjs/builders";
import emojiCharacters from "../emojiCharacters";
import { parseLink, SearchResult, searchSpotify, SearchType, SpotifyResource, startPlayback } from "../helpers/spotify";
import { generateSearchResults, joinMember } from "../helpers/discord";
import { errorRed, spotifyGreen } from "colors";

const playEmbed = new MessageEmbed({
	color: spotifyGreen,
	description: emojiCharacters.play,
});
const errorEmbed = new MessageEmbed({
	color: errorRed,
});


// globals
let interaction: CommandInteraction;
let spotifyAPI: SpotifyWebApi;
let player: AudioPlayer;

module.exports = {
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("Start playback of given link or name or unpause current spotify playback.")
		.addStringOption((option) => {
			return option
				.setName("type")
				.setDescription("Select which type of content to search for, omit to search everything.")
				.setRequired(false)
				.addChoice("track", "track")
				.addChoice("playlist", "playlist")
				.addChoice("album", "album")
				.addChoice("artist", "artist")
				.addChoice("show", "show")
				.addChoice("episode", "episode");
		})
		.addStringOption((option) => {
			return option
				.setName("query")
				.setDescription("Spotify URL/URI or name of what to search for.")
				.setRequired(false);
		}),
	execute(_interaction: CommandInteraction, _spotifyAPI: SpotifyWebApi,
		_player: AudioPlayer) {
		// set globals
		interaction = _interaction;
		spotifyAPI = _spotifyAPI;
		player = _player;

		const member = interaction.member as GuildMember | null;
		if (!member) {return;}
		if (!member.voice.channel) {
			interaction.reply({
				embeds: [errorEmbed.setDescription("Please join a voice channel first!")],
				ephemeral: true,
			});
			return;
		}

		const searchType = interaction.options.getString("type", false) as SearchType | null;
		const seachQuery = interaction.options.getString("query", false);

		if (searchType && !seachQuery) {
			interaction.reply({
				embeds: [errorEmbed.setDescription("If you select a type, please also provide a search query!")],
				ephemeral: true,
			});
			return;
		}

		if (!seachQuery) {
			// there is no search query so try to unpause or transfer playback
			spotifyAPI.getMyCurrentPlaybackState().then(
				function(data) {
					if (data.statusCode === 204) {
						interaction.reply({ embeds: [
							// TODO better message (help command may get deleted)
							errorEmbed.setDescription("Nothing's currently playing. To see all commands use `help`."),
						] });
						// TODO catch nothings playing -> is this a good solution?
					}
					else if (data.body.device.id === DEVICE_ID) {
						initializePlayback(null, false);
					}
					else {
						initializePlayback(null, true);
					}
				},
				function(error) {
					console.error("ERROR: getMyCurrentPlaybackState", error);
					interaction.reply({
						// TODO
						embeds: [errorEmbed.setDescription("There was an error while fetching")],
						ephemeral: true,
					});
				},
			);
		}
		else {
			// there es a search query or a link
			if (searchType) {
				startSpotifySearch(seachQuery, [searchType]);
			}
			else {
				const resource = parseLink(seachQuery);
				if (resource) {
					initializePlayback(resource, false);
				}
				else {
					startSpotifySearch(seachQuery, ["album", "artist", "playlist", "track", "show", "episode"]);
				}
			}
		}
	},
} as Command;

/**
 * Search Spotify with given query for given type of content
 * @param {string} query - Search for this query
 * @param {searchType} types - Search only these types of content
 */
function startSpotifySearch(query: string, types: SearchType[]) {
	let results: SearchResult[];
	searchSpotify(query, types, spotifyAPI).then(
		function(_results) {
			results = _results;
			const reply = generateSearchResults(query, results);
			if (!reply) {
				interaction.reply({
					embeds: [errorEmbed.setDescription("There are no results for your search request.")],
					ephemeral: true,
				});
				// TODO think of error handling system
				throw new Error();
			}
			else {
				return interaction.reply(reply) as Promise<Message>;
			}
		},
		function(error) {
			console.error("ERROR: search", error);
			interaction.reply({
				embeds: [errorEmbed.setDescription("Search did not complete successfully.")],
				ephemeral: true,
			});
			throw new Error();
		},
	).then((message) => {
		// wait 30 sec for a button press
		return message.awaitMessageComponent({ componentType: "BUTTON", time: 30_000 });
	}).then((buttonInteraction) => {
		let selection: number;
		try {
			selection = parseInt(buttonInteraction.customId);
		}
		catch (error) {
			// TODO send internal error
			return;
		}
		initializePlayback(parseLink(results[selection].uri), true);
	}).catch((error) => {
		console.log("No interaction with search buttons after 30 sec (or other error).");
	}).finally(() => {
		interaction.deleteReply();
	});
}

/**
 * Make sure bot is in voice channel before starting playback on spotify
 * @param {SpotifyResource | null} resource link to play on spotify
 * @param {boolean} transfer passthrough if playback needs to be transfered
 */
function initializePlayback(resource: SpotifyResource | null,
	transfer: boolean) {
	const guild = interaction.guild as Guild;
	const member = interaction.member as GuildMember;
	// check if already in channel
	const connection = getVoiceConnection(guild.id);
	if (connection) {
		const newConnection = joinMember(member, guild);
		if (newConnection) {
			playSpotify(resource, transfer, newConnection, true);
		}
		else {
			playSpotify(resource, transfer, connection, true);
		}
	}
	else {
		// we know we get a connection because we don't have a connection yet
		const connection = joinMember(member, guild) as VoiceConnection;
		playSpotify(resource, transfer, connection, false);
	}
}

/**
 * Start playback in Spotify
 * @param {SpotifyResource | null} resource - resource to play in Spotify
 * @param {boolean} transfer - must playback transfered to Librespot device before starting playback
 * @param {VoiceConnection} connection - voiceConnection of bot to play audio to Discord
 * @param {boolean} alreadyConnected - if true, connection is already subscribed to player
 */
function playSpotify(resource: SpotifyResource | null, transfer: boolean,
	connection: VoiceConnection, alreadyConnected: boolean) {
	const playbackErrorEmbed = errorEmbed.setDescription("Spotify playback could not be started.");
	startPlayback(resource, transfer, spotifyAPI).then(
		function() {
			if (!alreadyConnected) {
				connection.subscribe(player);
			}
			interaction.reply({ embeds: [playEmbed] });
		},
		function(error) {
			console.error("ERROR: play", error);
			interaction.reply({ embeds: [playbackErrorEmbed] });
		},
	);
}
