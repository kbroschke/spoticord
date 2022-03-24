import { Message, MessageEmbed } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";
import { AudioPlayer, getVoiceConnection, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";

const errorEmbed = new MessageEmbed({
	color: "#f0463a",
});

type searchType = Parameters<SpotifyWebApi["search"]>[1][number]

module.exports = {
	name: "play",
	description: "Start playback of given track/playlist/album/artist. If no argument is given, current Spotify player gets just unpaused.",
	execute(message: Message, args: string[], spotifyAPI: SpotifyWebApi,
		player: AudioPlayer) {
		if (!message.member) {return;}
		if (!message.member.voice.channel) {
			message.reply("please join a voice channel first!");
			return;
		}

		spotifyAPI = spotifyAPI;

		spotifyAPI.getMyCurrentPlaybackState().then(
			function(data) {
				if (args.length === 0) {
					if (JSON.stringify(data.body) === "{}") {
						message.channel.send({ embeds: [
							errorEmbed.setDescription("Nothing's currently playing. To see all commands use `help`."),
						] });
						// TODO catch nothings playing -> is this a good solution?
					}
					else if (data.body.device.id === DEVICE_ID) {
						initializePlayback(message, null, false, spotifyAPI,
							player);
					}
					else {
						initializePlayback(message, null, true, spotifyAPI,
							player);
					}
				}
				else {
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
					case "track":
					case "album":
					case "playlist":
					case "artist":
					case "show":
					case "episode":
						if (args.length < 2) {
							message.channel.send({ embeds: [
								errorEmbed.setDescription(
									"You need to provide the name of the "+
									`${args[0]}!`),
							] });
						}
						else {
							// remove 1st element so rest can be joined as search query
							const searchType = args.shift() as searchType;
							searchSpotify(args.join(" "),
								[searchType], message, spotifyAPI);
						}
						break;
					default:
						if (isSpotifyLink(args[0])) {
							// TODO make spotify URI from URL
							console.log(data.body);
							if (JSON.stringify(data.body) == "{}") {
								initializePlayback(message, args[0], true,
									spotifyAPI, player);
							}
							else if (data.body.device.id ==
								DEVICE_ID) {
								initializePlayback(message, args[0], false,
									spotifyAPI, player);
							}
							else {
								initializePlayback(message, args[0], true,
									spotifyAPI, player);
							}
						}
						else {
							searchSpotify(args.join(" "), ["track", "album", "playlist"], message, spotifyAPI);
						}
						break;
					}
				}
			},
			function(error) {
				console.error("ERROR: getMyCurrentPlaybackState", error);
			},
		);
	},
};

/**
 * Reply to a message that there were no search results.
 * @param {Message} message - Message to reply to
 */
function sendSearchUnsuccessful(message: Message) {
	message.reply("there are no results matching your search request.");
}

/**
 * Search Spotify with given query for given type of content
 * @param {string} query - Search for this query
 * @param {searchType} type - Search only this type of content
 * @param {Message} message - Message to reply to with results
 * @param {SpotifyWebApi} spotifyAPI - SpotifyAPI instance to execute search
 */
function searchSpotify(query: string, type: searchType[], message: Message,
	spotifyAPI: SpotifyWebApi) {
	spotifyAPI.search(query, type, { limit: 5 }).then(
		function(data) {
			let items:
				SpotifyApi.AlbumObjectSimplified[] |
				SpotifyApi.ArtistObjectFull[] |
				SpotifyApi.EpisodeObjectSimplified[] |
				SpotifyApi.PlaylistObjectSimplified[] |
				SpotifyApi.ShowObjectSimplified[] |
				SpotifyApi.TrackObjectFull[] = [];

			if (type.length === 1) {
				if (data.body.albums) {
					items = data.body.albums.items;
				}
				else if (data.body.artists) {
					items = data.body.artists.items;
				}
				else if (data.body.episodes) {
					items = data.body.episodes.items;
				}
				else if (data.body.playlists) {
					items = data.body.playlists.items;
				}
				else if (data.body.shows) {
					items = data.body.shows.items;
				}
				else if (data.body.tracks) {
					items = data.body.tracks.items;
				}
				sendResults(message, items);
			}
			else {
				// merge all results together
				const albumItems: SpotifyApi.AlbumObjectSimplified[] =
					data.body.albums?.items || [];
				const playlistItems: SpotifyApi.PlaylistObjectSimplified[] =
					data.body.playlists?.items || [];
				const trackItems: SpotifyApi.TrackObjectFull[] =
					data.body.tracks?.items || [];

				const appendItem = (dataitems: typeof items) => {
					if (items.length >= 10) { // TODO IS THIS RIGHT??
						const item = dataitems.shift();
						if (item) {
							items[items.length] = item;
						}
					}
				};

				let oldItemLength = 0;
				while (items.length < 10) {
					oldItemLength = items.length;

					appendItem(trackItems);
					appendItem(albumItems);
					appendItem(playlistItems);

					// break if no new items got added (no more search results)
					if (oldItemLength === items.length) break;
				}

				sendResults(message, items);
			}
		},
		function(error) {
			console.error("ERROR: search", error);
			message.channel.send({ embeds: [
				errorEmbed.setDescription("Search did not complete successfully."),
			] });
		},
	);
}

/**
 * Send Spotify search results in a human readable format (list)
 * @param {Message} message - message to reply to with results
 * @param {SpotifyApi.AlbumObjectSimplified[] | SpotifyApi.ArtistObjectFull[] | SpotifyApi.EpisodeObjectSimplified[] | SpotifyApi.PlaylistObjectSimplified[] | SpotifyApi.ShowObjectSimplified[] | SpotifyApi.TrackObjectFull[]} items - array of search results to put in message
 */
function sendResults(message: Message, items:
	SpotifyApi.AlbumObjectSimplified[] |
	SpotifyApi.ArtistObjectFull[] |
	SpotifyApi.EpisodeObjectSimplified[] |
	SpotifyApi.PlaylistObjectSimplified[] |
	SpotifyApi.ShowObjectSimplified[] |
	SpotifyApi.TrackObjectFull[]) {
	if (items.length === 0) {
		sendSearchUnsuccessful(message);
	}
	else {
		// turn spotify search api response into readable list
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
		message.channel.send({ embeds: [searchEmbed] });
	}
}

/**
 * Make sure bot is in voice channel before starting playback on spotify
 * @param {Message} message - message for context
 * @param {string | null} link - link to play on spotify
 * @param {boolean} transfer - passthrough if playback needs to be transfered
 * @param {SpotifyWebApi} spotifyAPI - passthrough spotify API instance
 * @param {AudioPlayer} player - passthrough audio player
 */
function initializePlayback(message: Message, link: string | null,
	transfer: boolean, spotifyAPI: SpotifyWebApi,
	player: AudioPlayer) {
	if (!message.guildId || !message.guild) {
		// DMs are already catched prior
		return;
	}
	// check if already in channel
	const connection = getVoiceConnection(message.guildId);
	if (connection) {
		// TODO decide if feature in or out
		/*
		if (message.guild.me.voice.channelId ===
			message.member?.voice.channelId) {
			playSpotify(message, link, transfer,
				message.guild.me.voice.connection, true, spotifyAPI, player);
		}
		else {
			message.reply("please join the bot's voice channel first!");
		}
		*/
		playSpotify(message, link, transfer, connection, true, spotifyAPI,
			player);
	}
	// if not then join the channel and create connection
	else {
		if (!message.member?.voice?.channelId) {
			// we already tested earlier that message.member has a voiceChannel
			return;
		}
		const connection = joinVoiceChannel({
			channelId: message.member.voice.channelId,
			guildId: message.guildId,
			adapterCreator: message.guild.voiceAdapterCreator,
		});
		playSpotify(message, link, transfer, connection, false, spotifyAPI,
			player);
	}
}

/**
 * Start playback in Spotify
 * @param {Message} message - message for context
 * @param {string | null} link - link of song/episode/... to play in Spotify
 * @param {boolean} transfer - must playback transfered to Librespot device before starting playback
 * @param {VoiceConnection} connection - voiceConnection of bot to play audio to Discord
 * @param {boolean} alreadyConnected - if true, we don't need a new dispatcher because audio stream is already connected
 * @param {SpotifyWebApi} spotifyAPI - Spotify API instance
 * @param {AudioPlayer} player - passthrough audio player
 */
function playSpotify(message: Message, link: string | null, transfer: boolean,
	connection: VoiceConnection, alreadyConnected: boolean,
	spotifyAPI: SpotifyWebApi, player: AudioPlayer) {
	const playbackErrorEmbed = errorEmbed.setDescription("Playback could not be started.");

	// start playing specified URL on librespot device
	if (link) {
		spotifyAPI.play(
			{
				device_id: DEVICE_ID,
				uris: [link],
			},
		).then(
			function() {
				play(message, connection, player);
				message.react("▶️");
			},
			function(error) {
				console.error("ERROR: play (link)", error);
				message.channel.send({ embeds: [playbackErrorEmbed] });
			},
		);
	}
	// else just start playback
	else if (transfer) {
		spotifyAPI.transferMyPlayback([DEVICE_ID],
			{ play: true }).then(
			function() {
				play(message, connection, player);
				message.react("▶️");
			},
			function(error) {
				console.error("ERROR: transferMyPlayback", error);
				message.channel.send({ embeds: [playbackErrorEmbed] });
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
					play(message, connection, player);
				}
				message.react("▶️");
			},
			function(error) {
				console.error("ERROR: play", error);
				message.channel.send({ embeds: [playbackErrorEmbed] });
			},
		);
	}
}

/**
 * Connect Audio from spotify output to discord connection
 * @param {Message} message - message for context
 * @param {VoiceConnection} connection - voiceConnction to play audio
 * @param {AudioPlayer} player - passthrough audio player
 */
function play(message: Message, connection: VoiceConnection,
	player: AudioPlayer) {
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
