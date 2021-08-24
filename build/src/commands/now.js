"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed = new discord_js_1.MessageEmbed().setColor("#1DB954");
module.exports = {
    name: "now",
    description: "Shows info about currently playing track.",
    execute(message, args, spotifyAPI) {
        spotifyAPI.getMyCurrentPlayingTrack().then(function (data) {
            const item = data.body.item;
            if (item) {
                const song = item.name;
                let itemContext;
                let creatorList;
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
                const position = Math.round((10 * progressInMS) / totalDurationInMS);
                let timeBar = "[";
                for (let i = 1; i < position; i++) {
                    timeBar += "▬";
                }
                timeBar += "](https://www.youtube.com/watch?v=dQw4w9WgXcQ):radio_button:";
                for (let i = position + 1; i < 11; i++) {
                    timeBar += "▬";
                }
                message.channel.send(embed
                    .setTitle(song)
                    .setDescription(`by ${creatorList}\n` +
                    `from ${contextName}\n\n` +
                    `${progressMin}:${progressSec}` +
                    `\u2002${timeBar}\u2002` +
                    `${totalMin}:${totalSec}`)
                    .setThumbnail(coverIMG)
                    .setURL(urlSong));
            }
            else {
                sendNothingsPlaying(message);
            }
        }, function (error) {
            console.error("--- ERROR PLAYBACK STATE ---\n", error);
            sendNothingsPlaying(message);
        });
    },
};
/**
 * Converts number in milliseconds into respectable pair of minutes and seconds
 * @param {number} progressMS - number in milliseconds
 * @return {string[]} Array of minutes and seconds as strings
 */
function msToMMSS(progressMS) {
    let progressInS = Math.floor(progressMS / 1000);
    const progressInM = Math.floor(progressInS / 60);
    progressInS = progressInS % 60;
    return [
        progressInM.toString().length < 2 ? "0" + progressInM : progressInM,
        progressInS.toString().length < 2 ? "0" + progressInS : progressInS,
    ];
}
/**
 * Send message that nothing is currently playing
 * @param {Message} message - Send response in channel of this message
 */
function sendNothingsPlaying(message) {
    message.channel.send(embed.setDescription("Nothing's currently playing."));
}
