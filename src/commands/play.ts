import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";
import { AudioPlayer, getVoiceConnection, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import type { Command } from "types/command";
import { SlashCommandBuilder } from "@discordjs/builders";

const errorEmbed = new MessageEmbed({
	color: "#f0463a",
});

type SearchType = Parameters<SpotifyWebApi["search"]>[1][number]
type SearchResultType =
	SpotifyApi.TrackObjectFull[] |
	SpotifyApi.ArtistObjectFull[] |
	SpotifyApi.AlbumObjectSimplified[] |
	SpotifyApi.PlaylistObjectSimplified[] |
	SpotifyApi.ShowObjectSimplified[] |
	SpotifyApi.EpisodeObjectSimplified[];
// globals


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
	execute(interaction: CommandInteraction, spotifyAPI: SpotifyWebApi,
		player: AudioPlayer) {
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
						initializePlayback(interaction, null, false, spotifyAPI,
							player);
					}
					else {
						initializePlayback(interaction, null, true, spotifyAPI,
							player);
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
				searchSpotify(seachQuery, [searchType], interaction,
					spotifyAPI);
			}
			else {
				if (isSpotifyLink(seachQuery)) {
					initializePlayback(interaction, seachQuery, false,
						spotifyAPI, player);
				}
				else {
					searchSpotify(seachQuery, ["album", "artist", "playlist", "track", "show", "episode"], interaction, spotifyAPI);
				}
			}
		}
	},
} as Command;

/**
 * Search Spotify with given query for given type of content
 * @param {string} query - Search for this query
 * @param {searchType} types - Search only these types of content
 * @param {CommandInteraction} interaction - Interaction to reply to with results
 * @param {SpotifyWebApi} spotifyAPI - SpotifyAPI instance to execute search
 */
function searchSpotify(query: string, types: SearchType[],
	interaction: CommandInteraction, spotifyAPI: SpotifyWebApi) {
	spotifyAPI.search(query, types, { limit: 5, market: "DE" }).then(
		function(data) {
			let items: SearchResultType = [];

			if (types.length === 1) {
				if (data.body.tracks) {
					items = data.body.tracks.items;
				}
				else if (data.body.artists) {
					items = data.body.artists.items;
				}
				else if (data.body.albums) {
					items = data.body.albums.items;
				}
				else if (data.body.playlists) {
					items = data.body.playlists.items;
				}
				else if (data.body.shows) {
					items = data.body.shows.items;
				}
				else if (data.body.episodes) {
					items = data.body.episodes.items;
				}

				sendResults(interaction, items);
			}
			else {
				// merge all results together
				const trackItems = data.body.tracks?.items || [];
				const artistItems = data.body.artists?.items || [];
				const albumItems = data.body.albums?.items || [];
				const playlistItems = data.body.playlists?.items || [];
				const showItems = data.body.shows?.items || [];
				const episodeItems = data.body.episodes?.items || [];

				const totalResults = 5;
				const appendItem = (dataitems: typeof items) => {
					if (items.length <= totalResults) {
						const item = dataitems.shift();
						if (item) {
							// add item to items, can't .push() because of types intersecting to 'never'
							items[items.length] = item;
						}
					}
				};

				let oldItemLength = 0;
				while (items.length < totalResults) {
					oldItemLength = items.length;

					appendItem(trackItems);
					appendItem(artistItems);
					appendItem(albumItems);
					appendItem(playlistItems);
					appendItem(showItems);
					appendItem(episodeItems);

					// break if no new items got added (no more search results)
					if (oldItemLength === items.length) break;
				}

				sendResults(interaction, items);
			}
		},
		function(error) {
			console.error("ERROR: search", error);
			interaction.reply({
				embeds: [errorEmbed.setDescription("Search did not complete successfully.")],
				ephemeral: true,
			});
		},
	);
}

/**
 * Send Spotify search results in a human readable format (list)
 * @param {CommandInteraction} interaction - interaction to reply to with results
 * @param {SearchResultType} items - array of search results to put in message
 */
function sendResults(interaction: CommandInteraction, items: SearchResultType) {
	if (items.length === 0) {
		interaction.reply({
			embeds: [errorEmbed.setDescription("There are no results for your search request.")],
			ephemeral: true,
		});
	}
	else {
		// turn spotify search response into a readable list

		// TODO make action row button for each result

		let answer = "";

		items.forEach((element, index) => {
			let indexEmote: string;
			switch (index) {
			case 0:
				indexEmote = ":one:";
				break;
			case 1:
				indexEmote = ":two:";
				break;
			case 2:
				indexEmote = ":three:";
				break;
			case 3:
				indexEmote = ":four:";
				break;
			case 4:
				indexEmote = ":five:";
				break;
			case 5:
				indexEmote = ":six:";
				break;
			case 6:
				indexEmote = ":seven:";
				break;
			case 7:
				indexEmote = ":eight:";
				break;
			case 8:
				indexEmote = ":nine:";
				break;
			case 9:
				indexEmote = ":keycap_ten:";
				break;
			default:
				indexEmote = (index + 1).toString();
				break;
			}

			answer += `${indexEmote}: ${element.name}`;

			switch (element.type) {
			case "album":
			case "track":
				answer += ` by ${element.artists[0].name}`;
			case "artist":
				break;
			case "playlist":
				answer += ` by ${element.owner.display_name}`;
				break;
			case "show":
				answer += ` by ${element.publisher}`;
			}

			answer += ` \`${element.type}\`\n`;
		});

		const searchEmbed = new MessageEmbed({
			title: "Search results",
			color: "#1DB954",
			description: answer,
		});
		interaction.reply({ embeds: [searchEmbed] });
	}
}

/**
 * Make sure bot is in voice channel before starting playback on spotify
 * @param {CommandInteraction} interaction - interaction which sent play command
 * @param {string | null} link - link to play on spotify
 * @param {boolean} transfer - passthrough if playback needs to be transfered
 * @param {SpotifyWebApi} spotifyAPI - passthrough spotify API instance
 * @param {AudioPlayer} player - passthrough audio player
 */
function initializePlayback(interaction: CommandInteraction,
	link: string | null, transfer: boolean, spotifyAPI: SpotifyWebApi,
	player: AudioPlayer) {
	if (!interaction.guildId || !interaction.guild || !interaction.member) {
		// DMs are already catched prior
		return;
	}

	// check if already in channel
	const connection = getVoiceConnection(interaction.guildId);
	if (connection) {
		playSpotify(interaction, link, transfer, connection, true, spotifyAPI,
			player);
	}
	// if not then join the channel and create connection
	else {
		const member = interaction.member as GuildMember;
		if (!member.voice.channelId) {
			// we already tested earlier that message.member has a voiceChannel
			return;
		}
		const connection = joinVoiceChannel({
			channelId: member.voice.channelId,
			guildId: interaction.guildId,
			adapterCreator: interaction.guild.voiceAdapterCreator,
		});
		playSpotify(interaction, link, transfer, connection, false, spotifyAPI,
			player);
	}
}

/**
 * Start playback in Spotify
 * @param {CommandInteraction} interaction - interaction which sent play command
 * @param {string | null} link - link of song/episode/... to play in Spotify
 * @param {boolean} transfer - must playback transfered to Librespot device before starting playback
 * @param {VoiceConnection} connection - voiceConnection of bot to play audio to Discord
 * @param {boolean} alreadyConnected - if true, we don't need a new dispatcher because audio stream is already connected
 * @param {SpotifyWebApi} spotifyAPI - Spotify API instance
 * @param {AudioPlayer} player - passthrough audio player
 */
function playSpotify(interaction: CommandInteraction, link: string | null,
	transfer: boolean, connection: VoiceConnection, alreadyConnected: boolean,
	spotifyAPI: SpotifyWebApi, player: AudioPlayer) {
	const playEmbed = new MessageEmbed({
		color: "#1DB954",
		description: "⏮️",
	});
	const playbackErrorEmbed = errorEmbed.setDescription("Spotify playback could not be started.");

	// start playing specified URL on librespot device
	if (link) {
		spotifyAPI.play(
			{
				device_id: DEVICE_ID,
				uris: [link],
			},
		).then(
			function() {
				play(connection, player);
				interaction.reply({ embeds: [playEmbed] });
			},
			function(error) {
				console.error("ERROR: play (link)", error);
				interaction.reply({ embeds: [playbackErrorEmbed] });
			},
		);
	}
	// else just start playback
	else if (transfer) {
		spotifyAPI.transferMyPlayback([DEVICE_ID],
			{ play: true }).then(
			function() {
				play(connection, player);
				interaction.reply({ embeds: [playEmbed] });
			},
			function(error) {
				console.error("ERROR: transferMyPlayback", error);
				interaction.reply({ embeds: [playbackErrorEmbed] });
			},
		);
	}
	else {
		spotifyAPI.play(
			{
				device_id: DEVICE_ID,
			},
		).then(
			function() {
				if (!alreadyConnected) {
					play(connection, player);
				}
				interaction.reply({ embeds: [playEmbed] });
			},
			function(error) {
				console.error("ERROR: play", error);
				interaction.reply({ embeds: [playbackErrorEmbed] });
			},
		);
	}
}

/**
 * Connect Audio from spotify output to discord connection
 * @param {VoiceConnection} connection - voiceConnction to play audio
 * @param {AudioPlayer} player - passthrough audio player
 */
function play(connection: VoiceConnection,
	player: AudioPlayer) {
	// TODO refactor (keep in mind: https://discordjs.guide/voice/voice-connections.html#playing-audio)
	connection.subscribe(player);
}

/**
 * Determines wether a given link is a valid Spotify link
 * @param {string} link - link to test
 * @return {boolean} true if link is valid Spotify link
 */
function isSpotifyLink(link: string): boolean {
	// TODO REGEX!!
	if (link.startsWith("https://open.spotify.com/") || link.startsWith("spotify:")) {
		return true;
	}
	return false;
}


/*
TODO search result selection as action row buttons?

switch (args[0]) {
	case "1":
	case "2":
	case "3":
	case "4":
	case "5":
		// TODO play results[args[0]];
		// use TextChannel.awaitMessages();
		message.channel.send({ embeds: [
			errorEmbed.setDescription("This feature is WIP"),
		] });
		break;
}
*/
