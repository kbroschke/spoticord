// import libraries
console.log('Loading libraries...');

const Discord = require('discord.js');
const fs = require('fs');
const SpotifyWebApi = require('spotify-web-api-node');
const https = require('https');
const querystring = require('querystring');

// send http POST to renew spotify's refresh_token
function refreshSpotifyToken(refreshToken, clientID, clientSecret, next) {
	console.log('Refreshing Spotify\'s Access Token...');
	const data = querystring.stringify({
		'grant_type': 'refresh_token',
		'refresh_token': refreshToken,
	});
	const auth = 'Basic ' + new Buffer.from(clientID + ':' + clientSecret).toString('base64');
	const options = {
		hostname: 'accounts.spotify.com',
		port: 443,
		path: '/api/token',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': data.length,
			'Authorization': auth,
		},
	};

	const req = https.request(options, next);

	req.on('error', error => {
		console.error('--- HTTPS ERROR ---\n' + error);
	});

	req.write(data);
	req.end();
}

// load all the tokens from config.json
let config = '';
try {
	console.log('Loading config...');
	config = require('./config.json');
	console.log('Config loaded successfully!');
}
catch(err) {
	console.error('Error loading config. Generating default template...');
	const default_config = {
		'BOT_TOKEN': '',
		'SPOTIY_REFRESH_TOKEN': '',
		'SPOTIFY_CLIENT_ID': '',
		'SPOTIFY_CLIENT_SECRET': '',
		'SPOTIFYD_BOT_ID': '',
		'LOCKED': false,
	};
	console.error('Here\'s an template for the config file:');
	console.error(JSON.stringify(default_config, null, 4));
	process.exit();
}

// load the server-specific prefixes
let prefixes = '';
try {
	console.log('Loading server specific prefixes...');
	prefixes = require('./prefixes.json');
	console.log('Prefixes loaded successfully!');
}
catch(err) {
	console.error('Error loading prefixes.');
	console.error('If you don\'t have any old data to import, you can just create an empty JSON-file (only content: \'{}\')');
	process.exit();
}

console.log('Initialization complete. Starting Discord, Spotify and Audio APIs.');

const client = new Discord.Client();
const spotifyApi = new SpotifyWebApi();

const spotifydBotID = config.SPOTIFYD_BOT_ID;
const spotifyOwnerDiscordID = config.DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER;

let prefix;
let dispatcher;

const embedPing = new Discord.MessageEmbed().setColor('#1DB954').setTitle('Pong!');
const embedDescriptionOnly = new Discord.MessageEmbed().setColor('#1DB954');
const embedNow = new Discord.MessageEmbed().setColor('#1DB954');
const embedHelp = new Discord.MessageEmbed().setColor('#1DB954').setTitle('Command list & explanations');

function refreshSpotifyTokenCaller() {
	refreshSpotifyToken(config.SPOTIY_REFRESH_TOKEN, config.SPOTIFY_CLIENT_ID, config.SPOTIFY_CLIENT_SECRET, res => {
		let response = '';

		res.on('data', data => {
			response += data;
		});

		res.on('end', () => {
			if (res.statusCode == 200) {
				spotifyApi.setAccessToken(JSON.parse(response).access_token);
				console.log('Successfully updated Spotify Access Token!');
				spotifyApi.getMe().then(
					function(data) {
						console.log('Authenticated with Spotify Api as:', data.body.email);
					},
					function(error) {
						console.error('--- ERROR INITIALIZING SPOTIFY WEB API ---\n', error);
					},
				);
			}
			else {
				console.error(
					'--- SPOTIFY API RESPONSE ERROR ---\n',
					`HTTPS status code: ${res.statusCode}\n`,
					'Response body:\n' + response);
			}
		});

		res.on('error', error => {
			console.error(error);
		});
	});
}

// every spotify access_token is valid for 3600 sec (60min)
// setInterval: refresh the access_token every ~50min
setInterval(refreshSpotifyTokenCaller, 3000000);
// call it for first time, so we have access right away and not in 50 min...
refreshSpotifyTokenCaller();


// Incoming message event
client.on('message', async message => {
	try {
		// debug stuff
		// console.log("Message incoming from: " + message.author.username + " / " + message.author.id);
		// console.log("In: " + message.guild);
		// console.log("This is a guild? " + !(message.guild == null));
		// console.log("Message Content:\n" + message.content + "\n");
		// console.log("Message embeds:");
		// console.log(message.embeds);

		// dont react to other Bots
		if (message.author.bot) return;

		// check if bot is locked
		// this is useful if you're using your personal spotify fot this bot and dont want the bot being able to manipulate your playback 24/7
		const locked = config.LOCKED;

		// get prefix from json
		if (message.guild != null) {
			if (message.guild.id in prefixes) {
				prefix = prefixes[message.guild.id].prefix;
			}
			else {
				// default to this prefix
				prefix = '$';
			}
		}
		else {
			// if guild is null then it's a DM
			message.reply(
				'Please message me on a server, I\'m not comfortable with private messages.\n' +
				'But here\'s a neat trick:\n' +
				'You can mention me instead of using a prefix.\n' +
				'Example: To show the currently selected prefix send: ```@[me] prefix```');
			return;
		}

		// extract command and arguments from message

		// remove whitespaces
		let commandBody = message.content.trim();

		if (commandBody.startsWith(prefix)) {
			// remove prefix if there
			commandBody = message.content.slice(prefix.length);
		}
		else if (message.mentions.has(client.user)) {
			// remove mention from front (no regrets :D  -> idea for smarter filter: mentions includes message.author.id )
			commandBody = message.content.slice(client.user.id.length + 4);
		}
		else {
			// return because message isnt a command
			return;
		}

		console.log('Full command: ' + message.content);

		// remove possible whitespaces between prefix and command
		commandBody = commandBody.trim();

		// split message into array
		const args = commandBody.split(' ');
		// make everything lowercase
		args.map(item => item.toLowerCase());
		// remove command from other arguments
		const command = args.shift();

		// log command and args extracted from message
		console.log(`Prefix: ${prefix}`);
		console.log(`Command: ${command}`);
		console.log('Args after command:');
		console.log(args);

		// process command
		switch (command) {
		case 'ping': {
			const timeTaken = Date.now() - message.createdTimestamp;
			message.channel.send(embedPing.setDescription('`' + timeTaken + ' ms`'));
			console.log(`Latency: ${timeTaken} ms`);
			if (args[0] == 'debug') {
				// TODO: extract spotify latency from librespot log (stderr), verbose logging must be active (option -v)
			}
			break;
		}
		case 'play': {
			if (locked) {
				message.channel.send('Sorry, currently I\'m not available for this task.');
				return;
			}

			if (!message.member.voice.channel) {
				message.reply('please join a voice channel first!');
				return;
			}

			if (args.length < 1) {
				spotifyApi.getMyCurrentPlaybackState().then(
					function(data) {
						if (JSON.stringify(data.body) == '{}') {
							message.channel.send(embedDescriptionOnly.setDescription('Nothing\'s currently playing. You can start playback by providing a track after the `play` command.'));
						}
						else {
							initializePlayback(data, message);
						}
					},
					function(error) {
						console.error('Playback state error', error);
					},
				);
			}
			else {
				switch (args[0]) {
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
					// play results[args[0]];
					message.channel.send(embedDescriptionOnly.setDescription('This feature is WIP'));
					break;
				case 'track':
				case 'album':
				case 'playlist':
				case 'artist':
					if (args.length < 2) {
						message.channel.send(embedDescriptionOnly.setDescription(`You need to provide the name of the ${args[0]}!`));
					}
					else {
						searchSpotify(args[1], args[0], message);
					}
					break;
				default:
					message.channel.send(embedDescriptionOnly.setDescription('Please specifiy search type ( `track` | `playlist` | `album` | `artist` )'));
					break;
				}
			}
			break;}
		case 'pause':
			if (locked) {
				message.channel.send('Sorry, currently I\'m not available for this task.');
			}
			else {
				spotifyApi.pause().then(
					function() {
						message.react('⏸️');
					},
					function(error) {
						console.error('--- ERROR PAUSING PLAYBACK ---\n', error);
						message.channel.send(embedDescriptionOnly.setDescription('Playback could not be paused. Please try again later.'));
					},
				);
			}
			break;
		case 'stop':
		case 'leave':
			if (locked) {
				message.channel.send('Sorry, currently I\'m not available for this task.');
			}
			else {
				if (message.guild.voice) {
					message.guild.voice.connection.disconnect();
				}
				spotifyApi.pause().then(
					function() {
						message.react('👋');
					},
					function(error) {
						console.error('--- ERROR PAUSING PLAYBACK ---\n', error);
						message.channel.send(embedDescriptionOnly.setDescription('Playback could not be paused. Please try again later.'));
					},
				);
			}
			break;
		case 'now':
			spotifyApi.getMyCurrentPlayingTrack().then(
				function(data) {
					const item = data.body.item;
					if (item != undefined) {
						try {
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

							message.channel.send(embedNow
								.setTitle(song)
								.setDescription(
									`by ${artistsList}\n` +
									`from ${album}\n\n` +
									`${progress_m}:${progress_s}\u2002${timeBar}\u2002${total_m}:${total_s}`)
								.setThumbnail(coverIMG)
								.setURL(urlSong));
						}
						catch(error) {
							console.error('Error while processing song information:\n', error);
							printNothingsPlaying(message);
						}
					}
					else {
						printNothingsPlaying(message);
					}
				}, function(error) {
					console.error('--- ERROR PLAYBACK STATE ---\n', error);
					printNothingsPlaying(message);
				},
			);
			break;
		case 'prefix':
			if (args.length < 1) {
				message.channel.send(embedDescriptionOnly.setDescription('Current command prefix is `' + prefix + '`'));
			}
			else if(!message.member.hasPermission('ADMINISTRATOR')) {
				message.reply('sorry but you\'re not an Administrator.');
			}
			else {
				prefix = args.join(' ');
				prefixes[message.guild.id] = {
					prefix: prefix,
				};
				fs.writeFile('./prefixes.json', JSON.stringify(prefixes, null, 4), error => {
					if (error) {
						console.error('--- FS WRITE ERROR ---', error);
						message.channel.send('Sorry! There was an internal error!');
					}
					else {message.channel.send(embedDescriptionOnly.setDescription(`Command prefix set to \`${prefix}\``));}
				});
			}
			break;
		case 'shuffle':
			if (args.length < 1) {
				message.channel.send(embedDescriptionOnly.setDescription('Possible arguments: `true`/`on` or `false`/`off`.'));
			}
			else if (args[0] == 'true' || args[0] == 'on') {
				console.log('Setting Shuffle mode to true.');
				setShuffle(true, message);
			}
			else if (args[0] == 'false' || args[0] == 'off') {
				console.log('Setting Shuffle mode to false.');
				setShuffle(false, message);
			}
			break;
		case 'repeat':
			if (args.length < 1) {
				message.channel.send(embedDescriptionOnly.setDescription('Possible arguments: `track`, `context` or `off`.'));
			}
			else if (args[0] == 'track') {
				setRepeat('track', message);
			}
			else if (args[0] == 'context') {
				setRepeat('context', message);
			}
			else if (args[0] == 'off') {
				setRepeat('off', message);
			}
			break;
		case 'skip':
			spotifyApi.skipToNext().then(
				function() {
					message.react('👌');
				},
				function(error) {
					console.error('--- ERROR SKIPPING TO NEXT TRACK ---', error);
					message.channel.send(embedDescriptionOnly.setDescription('Could not skip to next track. Please try again later.'));
				},
			);
			break;
		case 'again':
			spotifyApi.skipToPrevious().then(
				function() {
					message.react('👌');
				},
				function(error) {
					console.error('Skip previous error', error);
					message.channel.send(embedDescriptionOnly.setDescription('Could not skip to previous track. Please try again later.'));
				},
			);
			break;
		case 'help': {
			let helpPrefix = prefix;
			if (helpPrefix.length > 3) {
				helpPrefix += ' ';
			}
			message.channel.send(embedHelp.setDescription(
				// ping
				'• `' + helpPrefix + 'ping`\n' +
				'> Shows bot latency.\n' +
				// prefix
				'• `' + helpPrefix + 'prefix`\n' +
				'> Shows current prefix\n' +
				'• `' + helpPrefix + 'prefix <new prefix>`\n' +
				'> Sets new prefix.\n\n' +
				// now
				'• `' + helpPrefix + 'now`\n' +
				'> Shows info about currently playing track.\n' +
				// play
				'• `' + helpPrefix + 'play`\n' +
				'> Unpauses spotify player.\n' +
				'• `' + helpPrefix + 'play [track|playlist|album|artist] <name>`\n' +
				'> Start playback of given track/playlist/album/artist.\n' +
				// pause
				'• `' + helpPrefix + 'pause`\n' +
				'> Pauses spotify player.\n' +
				// stop || leave
				'• `' + helpPrefix + 'stop` or `' + helpPrefix + 'leave`\n' +
				'> Pauses spotify player and disconnects from voice channel.\n\n' +
				// TODO add modes
				// shuffle
				'• `' + helpPrefix + 'shuffle [mode]`\n' +
				'> Sets shuffle mode. Execute without mode to see all available modes.\n' +
				// repeat
				'• `' + helpPrefix + 'repeat [mode]`\n' +
				'> Sets repeat mode. Execute without mode to see all available modes.\n' +
				// skip
				'• `' + helpPrefix + 'skip`\n' +
				'> Skip to next track in queue.\n' +
				// again
				'• `' + helpPrefix + 'again`\n' +
				'> Skip to previously played track.\n' +
				''));
			// not listed: help, lock, unlock
			break;
		}
		case 'lock':
			if (message.member.user.id == spotifyOwnerDiscordID) {
				if (!locked) {
					config.LOCKED = true;
					fs.writeFile('./config.json', JSON.stringify(config, null, 4), error => {
						if (error) {
							console.log('--- FS WRITE ERROR ---', error);
							message.channel.send('Sorry! There was an internal error!');
						}
						else {
							message.reply('I\'m locked now.');
						}
					});
				}
				else {
					message.reply('I\'m already locked.');
				}
			}
			break;
		case 'unlock':
			if (message.member.user.id == spotifyOwnerDiscordID) {
				if (locked) {
					config.LOCKED = false;
					fs.writeFile('./config.json', JSON.stringify(config, null, 4), error => {
						if (error) {
							console.log('--- FS WRITE ERROR ---', error);
							message.channel.send('Sorry! There was an internal error!');
						}
						else {
							message.reply('I\'m not locked anymore.');
						}
					});
				}
				else {
					message.reply('I\'m already unlocked.');
				}
			}
			break;
		default:
			break;
		}
	}
	catch(error) {
		console.error('---------- CAUGHT ERROR ----------\n', error);
	}
});

client.on('ready', () => {
	console.log('Discord bot is ready!');
	client.user.setActivity('@me help', { type: 'LISTENING' });
});

// leave if last one in channel
client.on('voiceStateUpdate', (oldState, newState) => {
	if (oldState.channel == null) {
		return;
	}
	else {
		let channelMembers;

		if (oldState.id == spotifydBotID) {
			if (newState.channel == null) {
				return;
			}
			else {
				channelMembers = newState.channel.members;
			}
		}
		// check oldState because if user leaves then newState.channel is null
		else {
			channelMembers = oldState.channel.members;
		}

		// when user leaves oldState does NOT include this user in channel.members
		// dont know why but it works now
		if (channelMembers.size == 1 && channelMembers.has(spotifydBotID)) {
			channelMembers.get(spotifydBotID).voice.connection.disconnect();
		}
	}
});

client.login(config.BOT_TOKEN).then(() => {
	console.log('Discord login complete.');
});

function printNothingsPlaying(message) {
	message.channel.send(embedNow.setDescription('Nothing\'s currently playing.'));
}

function msToMM_SS(progress_ms) {
	let progress_s = Math.floor(progress_ms / 1000);
	let progress_m = Math.floor(progress_s / 60);
	progress_s = progress_s % 60;
	if (progress_m.toString().length < 2) progress_m = '0' + progress_m;
	if (progress_s.toString().length < 2) progress_s = '0' + progress_s;
	return [progress_m, progress_s];
}

function setShuffle(boolean, message) {
	spotifyApi.setShuffle({ state: boolean }).then(
		function() {
			message.react('👌');
		},
		function(error) {
			console.error('--- ERROR SETTING SHUFFLE MODE ---', error);
			message.channel.send(embedDescriptionOnly.setDescription('Shuffle mode could not be changed. Please try again later.'));
		},
	);
}

function setRepeat(option, message) {
	spotifyApi.setRepeat({ state: option }).then(
		function() {
			message.react('👌');
		},
		function(error) {
			console.error('--- ERROR SETTING REPEAT MODE ---', error);
			message.channel.send(embedDescriptionOnly.setDescription('Repeat mode could not be changed. Please try again later.'));
		},
	);
}

function searchSpotify(query, type, message) {
	spotifyApi.search(query, [type], { limit : 5 }).then(
		function(data) {
			// TODO
			const response = data.body;

			switch(type) {
			case 'track':


				message.channel.send(embedDescriptionOnly.setTitle('Found tracks:').setDescription(answer));
				break;
			case 'album':
				message.channel.send(embedDescriptionOnly.setTitle('Found albums:').setDescription(JSON.stringify(results.albums.items).slice(0, 5000)));
				break;
			case 'playlist':
				message.channel.send(embedDescriptionOnly.setTitle('Found playlists:').setDescription(JSON.stringify(results.playlists.items).slice(0, 5999)));
				break;
			case 'artist':
				message.channel.send(embedDescriptionOnly.setTitle('Found artists:').setDescription(JSON.stringify(results.artists.items).slice(0, 5999)));
				break;
			}
		},
		function(error) {
			console.error(error);
			message.channel.send('Search did not complete successfully. Please try again later.');
		},
	);
}

function play(message, connection) {
	dispatcher.on('error', error => console.error('Dispatcher error', error));

	dispatcher.on('finish', () => {
		console.log('Strean finished.');
	});
}

function playSpotify(data, message, connection) {
	if (data.body.device.id != '3c2f908d41b70e1d5b562ff6c7d9823d6c86e394') {
		spotifyApi.transferMyPlayback(
			{
				deviceIds:['3c2f908d41b70e1d5b562ff6c7d9823d6c86e394'],
				play: true,
			},
		).then(
			function() {
				play(message, connection);
				message.react('▶️');
			},
			function(error) {
				console.error('Playback transfer error', error);
				message.channel.send(embedDescriptionOnly.setDescription('Playback could not be started. Please try again later.'));
			},
		);
	}
	else {
		spotifyApi.play().then(
			function() {
				play(message, connection);
				message.react('▶️');
			},
			function(error) {
				console.error('Playback error', error);
				message.channel.send(embedDescriptionOnly.setDescription('Playback could not be started. Please try again later.'));
			},
		);
	}
}

function initializePlayback(data, message) {
	if (message.guild.voice && message.guild.voice.channel) {
		if (message.guild.voice.channel == message.member.voice.channel) {
			playSpotify(data, message, message.guild.voice.connection);
		}
		else {
			message.channel.send(embedDescriptionOnly.setDescription('Please join the bot\'s voice channel first.'));
		}
	}
	else {
		message.member.voice.channel.join().then(
			connection => {
				playSpotify(data, message, connection);
			},
		);
	}
}

/*
function buildList(array) {
	// let results = response.tracks.items;
	let answer = '';

	results.forEach((element, index) => {
		let _index;
		switch (index) {
		case 0:
			_index = ':one:';
			break;
		case 1:
			_index = ':one:';
			break;
		case 2:
			_index = ':one:';
			break;
		case 3:
			_index = ':one:';
			break;
		case 4:
			_index = ':one:';
			break;
		}
		answer += `${index + 1}.: ${element.name}\n`;
	});
	return 'string';
}
*/