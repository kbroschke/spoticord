const Discord = require('discord.js');
const embed = new Discord.MessageEmbed().setColor('#1DB954');

module.exports = {
	name: 'now',
	description: 'Shows info about currently playing track.',
	execute(message, args, spotifyAPI) {
		spotifyAPI.getMyCurrentPlayingTrack().then(
			function(data) {
				const item = data.body.item;
				if (item) {
					const song = item.name;
					const album = item.album.name;
					const artists = item.artists;
					let artistsList = artists[0].name;
					for (let i = 0; i < artists.length; i++) {
						if (i > 0) {
							artistsList += ', ' + artists[i].name;
						}
					}
					const coverIMG = item.album.images[0].url;
					const urlSong = item.external_urls.spotify;

					const progress_ms = data.body.progress_ms;
					const progress = msToMM_SS(progress_ms);
					const progress_m = progress[0];
					const progress_s = progress[1];

					const total_ms = item.duration_ms;
					const total = msToMM_SS(total_ms);
					const total_m = total[0];
					const total_s = total[1];

					const position = Math.round((10 * progress_ms) / total_ms);

					let timeBar = '[';
					for (let i = 1; i < position; i++) {
						timeBar += '▬';
					}
					timeBar += '](https://www.youtube.com/watch?v=dQw4w9WgXcQ):radio_button:';
					for (let i = position + 1; i < 11; i++) {
						timeBar += '▬';
					}

					message.channel.send(embed
						.setTitle(song)
						.setDescription(
							`by ${artistsList}\n` +
                                `from ${album}\n\n` +
                                `${progress_m}:${progress_s}\u2002${timeBar}\u2002${total_m}:${total_s}`)
						.setThumbnail(coverIMG)
						.setURL(urlSong));
				}
				else {
					sendNothingsPlaying(message);
				}
			}, function(error) {
				console.error('--- ERROR PLAYBACK STATE ---\n', error);
				sendNothingsPlaying(message);
			},
		);
	},
};

function msToMM_SS(progress_ms) {
	let progress_s = Math.floor(progress_ms / 1000);
	let progress_m = Math.floor(progress_s / 60);
	progress_s = progress_s % 60;
	if (progress_m.toString().length < 2) progress_m = '0' + progress_m;
	if (progress_s.toString().length < 2) progress_s = '0' + progress_s;
	return [progress_m, progress_s];
}

function sendNothingsPlaying(message) {
	message.channel.send(embed.setDescription('Nothing\'s currently playing.'));
}