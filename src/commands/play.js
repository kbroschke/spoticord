const Discord = require('discord.js');
const { DEVICE_ID } = require('../../config/spotify.json');

const embed = new Discord.MessageEmbed().setColor('#1DB954');
const embedSearch = new Discord.MessageEmbed().setColor('#1DB954').setTitle('Search results');

module.exports = {
	name: 'play',
	description: 'Start playback of given track/playlist/album/artist. If no argument is given, current Spotify player gets just unpaused.',
	execute(message, args, spotifyAPI) {
		if (!message.member.voice.channel) {
			message.reply('please join a voice channel first!');
			return;
		}

		spotifyAPI.getMyCurrentPlaybackState().then(
			function(data) {
				if (!args.length) {
					if (JSON.stringify(data.body) == '{}') {
						message.channel.send(embed.setDescription('Nothing\'s currently playing. You can start playback by providing a track after the `play` command.'));
					}
					else if (data.body.device.id == DEVICE_ID) {
						initializePlayback(message, null, false);
					}
					else {
						initializePlayback(message, null, true);
					}
				}
				else {
					switch (args[0]) {
					case '1':
					case '2':
					case '3':
					case '4':
					case '5':
						// TODO play results[args[0]];
						// use TextChannel.awaitMessages();
						message.channel.send(embed.setDescription('This feature is WIP'));
						break;
					case 'track':
					case 'album':
					case 'playlist':
					case 'artist':
						if (args.length < 2) {
							message.channel.send(embed.setDescription(`You need to provide the name of the ${args[0]}!`));
						}
						else {
							// remove 1st element so rest can be joined as search query
							const search_type = args.shift();
							searchSpotify(args.join(' '), [search_type], message);
						}
						break;
					default:
						if (args[0].toString().startsWith('https://open.spotify.com/') || args[0].toString().startsWith('spotify:')) {
							// TODO make spotify URI from URL
							console.log(data.body);
							if (JSON.stringify(data.body) == '{}') {
								initializePlayback(message, args[0], true);
							}
							else if (data.body.device.id == DEVICE_ID) {
								initializePlayback(message, args[0], false);
							}
							else {
								initializePlayback(message, args[0], true);
							}
						}
						else {
							searchSpotify(args.join(' '), ['track', 'album', 'playlist'], message);
						}
						break;
					}
				}
			},
			function(error) {
				console.error('Playback state error', error);
			},
		);
	},
};

function sendSearchUnsuccessful(message) {
	message.reply('there are no results matching your search request.');
}

function searchSpotify(query, type, message) {
	spotifyAPI.search(query, type, { limit : 5 }).then(
		function(data) {
			// WIP
			let type_name;
			if (type.length == 1) {
				type_name = type[0];
			}
			else {
				type_name = 'all';
			}
			switch(type_name) {
			case 'track': {
				const items = data.body.tracks.items;
				sendResults(message, items);
				break;
			}
			case 'album': {
				const items = data.body.albums.items;
				sendResults(message, items);
				break;
			}
			case 'playlist': {
				const items = data.body.playlists.items;
				sendResults(message, items);
				break;
			}
			case 'artist': {
				const items = data.body.artists.items;
				sendResults(message, items);
				break;
			}
			case 'all': {
				const items = [];
				// merge all results together
				let old_item_length = 0;

				const append_item = (dataitems) => {
					if (items.length >= 10 && dataitems.length) {
						items.push(dataitems.shift());
					}
				};

				while (items.length < 10) {

					old_item_length = items.length;

					append_item(data.body.tracks.items);
					append_item(data.body.albums.items);
					append_item(data.body.playlists.items);

					if (old_item_length === items.length) break;
				}

				sendResults(message, items);
				break;


			}
			}
		},
		function(error) {
			console.error(error);
			message.channel.send('Search did not complete successfully. Please try again later.');
		},
	);
}

function sendResults(message, items) {
	if (!items.length) {
		sendSearchUnsuccessful(message);
	}
	else {
		// turn spotify search api response into readable list
		let answer = '';

		items.forEach((element, index) => {
			let _index;
			switch (index) {
			case 0:
				_index = ':one:';
				break;
			case 1:
				_index = ':two:';
				break;
			case 2:
				_index = ':three:';
				break;
			case 3:
				_index = ':four:';
				break;
			case 4:
				_index = ':five:';
				break;
			case 5:
				_index = ':six:';
				break;
			case 6:
				_index = ':seven:';
				break;
			case 7:
				_index = ':eight:';
				break;
			case 8:
				_index = ':nine:';
				break;
			case 9:
				_index = ':keycap_ten:';
				break;
			default:
				_index = index + 1;
				break;
			}

			answer += `${_index}: ${element.name}`;

			switch (element.type) {
			case 'artist':
				break;
			case 'playlist':
				answer += ` by ${element.owner.display_name}`;
				break;
			default:
				answer += ` by ${element.artists[0].name}`;
				break;
			}

			answer += ` \`${element.type}\`\n`;
		});

		message.channel.send(embedSearch.setDescription(answer));
	}
}

function initializePlayback(message, link, transfer) {
	// check if already in channel
	if (message.guild.voice && message.guild.voice.channel) {
		if (message.guild.voice.channel == message.member.voice.channel) {
			initSpotify(message, link, transfer, message.guild.voice.connection);
		}
		else {
			message.channel.send(embed.setDescription('Please join the bot\'s voice channel first.'));
		}
	}
	// if not then join the channel and create connection
	else {
		message.member.voice.channel.join().then(
			connection => {
				initSpotify(message, link, transfer, connection);
			},
		);
	}
}

// TODO check device id on startup, then remove this section
function initSpotify(message, link, transfer, connection) {
	// if we already have the device ID start playback
	if (spotify_config.DEVICE_ID) {
		playSpotify(message, link, transfer, connection);
	}
	// if not get Device ID in Spotify Connect
	else {
		spotifyAPI.getMyDevices().then(
			function(data) {
				// check for device with name 'Librespot'
				if (data.body.devices) {
					for (let index = 0; index < data.body.devices.length; index++) {
						if (data.body.devices[index].name == 'Librespot') {
							spotify_config.DEVICE_ID = data.body.devices[index].id;
							fs.writeFile('../config/spotify.json', JSON.stringify(spotify_config, null, 4), error => {
								if (error) {
									console.error('Failed writing Spotify Device ID. I\'ll try again next time.');
									console.error(error);
								}
							});
							playSpotify(message, link, transfer, connection);
						}
					}
				}
			},
			function(error) {
				console.error('--- ERROR WHILE GETTING DEVICES ---\n', error);
				message.channel.send(embed.setDescription('Playback could not be started. Please try again later.'));
			},
		);
	}
}

function playSpotify(message, link, transfer, connection) {
	// start playback on Librespot Device

	// start playing specified URL on Librespot device
	if (link) {
		if (transfer) {
			spotifyAPI.transferMyPlayback([spotify_config.DEVICE_ID]).then(
				function() {
					spotifyAPI.play(
						{
							device_id: spotify_config.DEVICE_ID,
							uris: [link],
						},
					).then(
						function() {
							play(message, connection);
							message.react('▶️');
						},
						function(error) {
							console.error('--- ERROR STARTING SPOTIFY PLAYBACK ---\n', error);
							message.channel.send(embed.setDescription('Playback could not be started. Please try again later.'));
						},
					);
				},
				function(error) {
					console.error('--- ERROR STARTING SPOTIFY PLAYBACK ---\n', error);
					message.channel.send(embed.setDescription('Playback could not be started. Please try again later.'));
				},
			);
		}
		else {
			spotifyAPI.play(
				{
					device_id: spotify_config.DEVICE_ID,
					uris: [link],
				},
			).then(
				function() {
					play(message, connection);
					message.react('▶️');
				},
				function(error) {
					console.error('--- ERROR STARTING SPOTIFY PLAYBACK ---\n', error);
					message.channel.send(embed.setDescription('Playback could not be started. Please try again later.'));
				},
			);
		}
	}
	// else just start playback
	else if (transfer) {
		spotifyAPI.transferMyPlayback([spotify_config.DEVICE_ID], { play: true }).then(
			function() {
				play(message, connection);
				message.react('▶️');
			},
			function(error) {
				console.error('--- ERROR STARTING SPOTIFY PLAYBACK ---\n', error);
				message.channel.send(embed.setDescription('Playback could not be started. Please try again later.'));
			},
		);
	}
	else {
		spotifyAPI.play(
			{
				device_id: spotify_config.DEVICE_ID,
			},
		).then(
			function() {
				play(message, connection);
				message.react('▶️');
			},
			function(error) {
				console.error('--- ERROR STARTING SPOTIFY PLAYBACK ---\n', error);
				message.channel.send(embed.setDescription('Playback could not be started. Please try again later.'));
			},
		);
	}
}

function play(message, connection) {
	// TODO check if dispatcher is already playing, handle accordingly
	const dispatcher = connection.play(librespot.stdout, { type: 'converted', highWaterMark: 24 });

	dispatcher.on('start', () => {
		console.log('Stream started');
	});

	dispatcher.on('error', error => {
		console.error('Dispatcher error\n', error);
	});

	dispatcher.on('finish', () => {
		console.log('Stream finished.');
	});
}