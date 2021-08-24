"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const spotify_json_1 = __importDefault(require("../../config/spotify.json"));
const embed = new discord_js_1.MessageEmbed().setColor("#1DB954");
const embedSearch = new discord_js_1.MessageEmbed().setColor("#1DB954").setTitle("Search results");
module.exports = {
    name: "play",
    description: "Start playback of given track/playlist/album/artist. If no argument is given, current Spotify player gets just unpaused.",
    execute(message, args, spotifyAPI, librespot) {
        if (!message.member) {
            return;
        }
        if (!message.member.voice.channel) {
            message.reply("please join a voice channel first!");
            return;
        }
        spotifyAPI.getMyCurrentPlaybackState().then(function (data) {
            if (args.length === 0) {
                if (JSON.stringify(data.body) === "{}") {
                    message.channel.send(embed.setDescription("Nothing's currently playing. You can start playback by providing something to play after the `play` command. To see all options use `help`."));
                }
                else if (data.body.device.id === spotify_json_1.default.DEVICE_ID) {
                    initializePlayback(message, null, false, spotifyAPI, librespot);
                }
                else {
                    initializePlayback(message, null, true, spotifyAPI, librespot);
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
                        message.channel.send(embed.setDescription("This feature is WIP"));
                        break;
                    case "track":
                    case "album":
                    case "playlist":
                    case "artist":
                    case "show":
                    case "episode":
                        if (args.length < 2) {
                            message.channel.send(embed.setDescription("You need to provide the name of the " +
                                `${args[0]}!`));
                        }
                        else {
                            // remove 1st element so rest can be joined as search query
                            const searchType = args.shift();
                            searchSpotify(args.join(" "), [searchType], message, spotifyAPI);
                        }
                        break;
                    default:
                        if (isSpotifyLink(args[0])) {
                            // TODO make spotify URI from URL
                            console.log(data.body);
                            if (JSON.stringify(data.body) == "{}") {
                                initializePlayback(message, args[0], true, spotifyAPI, librespot);
                            }
                            else if (data.body.device.id ==
                                spotify_json_1.default.DEVICE_ID) {
                                initializePlayback(message, args[0], false, spotifyAPI, librespot);
                            }
                            else {
                                initializePlayback(message, args[0], true, spotifyAPI, librespot);
                            }
                        }
                        else {
                            searchSpotify(args.join(" "), ["track", "album", "playlist"], message, spotifyAPI);
                        }
                        break;
                }
            }
        }, function (error) {
            console.error("Playback state error", error);
        });
    },
};
/**
 * Reply to a message that there were no search results.
 * @param {Message} message - Message to reply to
 */
function sendSearchUnsuccessful(message) {
    message.reply("there are no results matching your search request.");
}
/**
 * Search Spotify with given query for given type of content
 * @param {string} query - Search for this query
 * @param {searchType} type - Search only this type of content
 * @param {Message} message - Message to reply to with results
 * @param {SpotifyWebApi} spotifyAPI - SpotifyAPI instance to execute search
 */
function searchSpotify(query, type, message, spotifyAPI) {
    spotifyAPI.search(query, type, { limit: 5 }).then(function (data) {
        let items = [];
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
            const albumItems = data.body.albums?.items || [];
            const playlistItems = data.body.playlists?.items || [];
            const trackItems = data.body.tracks?.items || [];
            const appendItem = (dataitems) => {
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
                if (oldItemLength === items.length)
                    break;
            }
            sendResults(message, items);
        }
    }, function (error) {
        console.error(error);
        message.channel.send("Search did not complete successfully. Please try again later.");
    });
}
/**
 * Send Spotify search results in a human readable format (list)
 * @param {Message} message - message to reply to with results
 * @param {SpotifyApi.AlbumObjectSimplified[] | SpotifyApi.ArtistObjectFull[] | SpotifyApi.EpisodeObjectSimplified[] | SpotifyApi.PlaylistObjectSimplified[] | SpotifyApi.ShowObjectSimplified[] | SpotifyApi.TrackObjectFull[]} items - array of search results to put in message
 */
function sendResults(message, items) {
    if (items.length === 0) {
        sendSearchUnsuccessful(message);
    }
    else {
        // turn spotify search api response into readable list
        let answer = "";
        items.forEach((element, index) => {
            let indexEmote;
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
        message.channel.send(embedSearch.setDescription(answer));
    }
}
/**
 * Make sure bot is in voice channel before starting playback on spotify
 * @param {Message} message - message for context
 * @param {string | null} link - link to play on spotify
 * @param {boolean} transfer - passthrough if playback needs to be transfered
 * @param {SpotifyWebApi} spotifyAPI - passthrough spotify API instance
 * @param {ChildProcessWithoutNullStreams} librespot - passthrough librespot instance
 */
function initializePlayback(message, link, transfer, spotifyAPI, librespot) {
    // check if already in channel
    if (message.guild?.voice?.connection) {
        if (message.guild.voice.channelID === message.member?.voice.channelID) {
            playSpotify(message, link, transfer, message.guild.voice.connection, spotifyAPI, librespot);
        }
        else {
            message.channel.send(embed.setDescription("Please join the bot's voice channel first."));
        }
    }
    // if not then join the channel and create connection
    // we already tested earlier that message.member has a voiceChannel
    else {
        message.member?.voice?.channel?.join().then((connection) => {
            playSpotify(message, link, transfer, connection, spotifyAPI, librespot);
        });
    }
}
/**
 * Start playback in Spotify
 * @param {Message} message - message for context
 * @param {string | null} link - link of song/episode/... to play in Spotify
 * @param {boolean} transfer - must playback transfered to Librespot device before starting playback
 * @param {VoiceConnection} connection - voiceConnection of bot to play audio to Discord
 * @param {SpotifyWebApi} spotifyAPI - Spotify API instance
 * @param {ChildProcessWithoutNullStreams} librespot - Librespot client
 */
function playSpotify(message, link, transfer, connection, spotifyAPI, librespot) {
    // start playback on Librespot Device
    // start playing specified URL on Librespot device
    if (link) {
        if (transfer) {
            spotifyAPI.transferMyPlayback([spotify_json_1.default.DEVICE_ID]).then(function () {
                spotifyAPI.play({
                    device_id: spotify_json_1.default.DEVICE_ID,
                    uris: [link],
                }).then(function () {
                    play(message, connection, librespot);
                    message.react("▶️");
                }, function (error) {
                    console.error("--- ERROR STARTING SPOTIFY PLAYBACK ---\n", error);
                    message.channel.send(embed.setDescription("Playback could not be started. Please try again later."));
                });
            }, function (error) {
                console.error("--- ERROR STARTING SPOTIFY PLAYBACK ---\n", error);
                message.channel.send(embed.setDescription("Playback could not be started. Please try again later."));
            });
        }
        else {
            spotifyAPI.play({
                device_id: spotify_json_1.default.DEVICE_ID,
                uris: [link],
            }).then(function () {
                play(message, connection, librespot);
                message.react("▶️");
            }, function (error) {
                console.error("--- ERROR STARTING SPOTIFY PLAYBACK ---\n", error);
                message.channel.send(embed.setDescription("Playback could not be started. Please try again later."));
            });
        }
    }
    // else just start playback
    else if (transfer) {
        spotifyAPI.transferMyPlayback([spotify_json_1.default.DEVICE_ID], { play: true }).then(function () {
            play(message, connection, librespot);
            message.react("▶️");
        }, function (error) {
            console.error("--- ERROR STARTING SPOTIFY PLAYBACK ---\n", error);
            message.channel.send(embed.setDescription("Playback could not be started. Please try again later."));
        });
    }
    else {
        spotifyAPI.play({
            device_id: spotify_json_1.default.DEVICE_ID,
        }).then(function () {
            play(message, connection, librespot);
            message.react("▶️");
        }, function (error) {
            console.error("--- ERROR STARTING SPOTIFY PLAYBACK ---\n", error);
            message.channel.send(embed.setDescription("Playback could not be started. Please try again later."));
        });
    }
}
/**
 * Connect Audio from spotify output to discord connection
 * @param {Message} message - message for context
 * @param {VoiceConnection} connection - voiceConnction to play audio
 * @param {ChildProcessWithoutNullStreams} librespot - librespot instance to get audio
 */
function play(message, connection, librespot) {
    // TODO check if dispatcher is already playing, handle accordingly
    const dispatcher = connection.play(librespot.stdout, { type: "converted", highWaterMark: 24 });
    dispatcher.on("start", () => {
        console.log("Stream started");
    });
    dispatcher.on("error", (error) => {
        console.error("Dispatcher error\n", error);
    });
    dispatcher.on("finish", () => {
        console.log("Stream finished.");
    });
}
/**
 * Determines wether a given link is a valid Spotify link
 * @param {string} link - link to test
 * @return {boolean} true if link is valid Spotify link
 */
function isSpotifyLink(link) {
    if (link.startsWith("https://open.spotify.com/") || link.startsWith("spotify:")) {
        return true;
    }
    return false;
}
