// import libraries
console.log('Loading libraries...');

const Discord = require('discord.js');
const fs = require('fs');
const SpotifyWebApi = require('spotify-web-api-node');
const { spawn } = require('child_process');
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

// create instances for Discord and Spotify APIs globally
const client = new Discord.Client();
let spotifyAPI;

// create config dir if not exists
if (!fs.existsSync('./config')) {
	fs.mkdirSync('./config');
}

// load discord config
let discord_config;
try {
	console.log('Loading discord config...');
	discord_config = require('./config/discord.json');
	if (discord_config.BOT_ID && discord_config.BOT_TOKEN) {
		if (!discord_config.DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER) {
			discord_config.LOCKED = false;
		}
		console.log('Discord config loaded successfully!');
	}
	else {
		console.log('Can\'t load config file! BOT_ID or BOT_TOKEN is empty.');
		process.exit();
	}
}
catch(error) {
	console.error('Error loading discord config.\nGenerating default template...');
	const default_config = {
		'BOT_ID': '',
		'BOT_TOKEN': '',
		'DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER': '',
		'LOCKED': false,
	};
	fs.writeFileSync('./config/discord.json', JSON.stringify(default_config, null, 4));
	console.log(
		'The template was saved to ./config/discord.json\n' +
		'Please fill it with your information. Only the bot\'s ID and token are required for the bot to work.\n' +
		'Both can be found at https://discord.com/developers/applications.\n' +
		'(The BOT_ID under General Information > Application ID)\n' +
		'(The BOT_TOKEN under Bot > Token)\n' +
		'The DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER can be left as an empty String if the feature for locking the bot is not needed.\n' +
		'Then start the bot again!',
	);
	process.exit();
}

// load spotify config
let spotify_config;
try {
	console.log('Loading spotify config...');
	spotify_config = require('./config/spotify.json');
	if (spotify_config.CLIENT_ID && spotify_config.CLIENT_SECRET && spotify_config.USERNAME && spotify_config.PASSWORD && spotify_config.LIBRESPOT_PATH) {
		spotifyAPI = new SpotifyWebApi({
			clientId: spotify_config.CLIENT_ID,
			clientSecret: spotify_config.CLIENT_SECRET,
			redirectUri: 'https://example.com/callback',
		});
		if (spotify_config.REFRESH_TOKEN) {
			console.log('Spotify config loaded successfully!');
		}
		else if (spotify_config.AUTH_CODE) {
			spotifyAPI.authorizationCodeGrant(spotify_config.AUTH_CODE).then(
				function(data) {
					spotify_config.REFRESH_TOKEN = data.body['refresh_token'];
					fs.writeFileSync('./config/spotify.json', JSON.stringify(spotify_config, null, 4));
					console.log('Successfully updated refresh token!');
					console.log('Please start the bot again. (I promise, this should be the last time)');
					process.exit();
				},
				function(error) {
					console.error(error);
					console.log(
						'Something went wrong while sending the auth code to Spotify.\n' +
						'Please make sure to paste the whole code you got in the redirect URL.\n' +
						'If you need a new auth code, just remove the current one from the config file and start the bot again.',
					);
					process.exit();
				},
			);
		}
		else {
			console.log(
				'Refresh Token is missing in Config.\n' +
				'After this text there will be an weblink.\n' +
				'You need to copy this into a browser and authenticate on the resulting webpage with your Spotify Account.\n' +
				'You will be redirected to example.com. You need to copy the code after \'code=\' in your browser\'s address bar. (yes, it\'s veeeery long)\n' +
				'You need to paste this code in the spotify.json file behind \'AUTH_CODE\'.\n' +
				'Then start the bot again.',
			);
			const scopes = [
				'user-read-email',
				'user-read-private',
				'user-read-playback-state',
				'user-modify-playback-state',
				'user-read-currently-playing',
			];
			console.log(spotifyAPI.createAuthorizeURL(scopes));
			process.exit();
		}
	}
	else {
		console.log('Can\'t load config file! A required parameter is missing. Please check the config file at ./config/spotify.json.');
		process.exit();
	}
}
catch(error) {
	console.error('Error loading spotify config. Generating default template...');
	const default_config = {
		'CLIENT_ID': '',
		'CLIENT_SECRET': '',
		'REFRESH_TOKEN': '',
		'AUTH_CODE': '',
		'USERNAME': '',
		'PASSWORD': '',
		'LIBRESPOT_PATH': '',
	};
	fs.writeFileSync('./config/spotify.json', JSON.stringify(default_config, null, 4));
	console.log(
		'The template was saved to ./config/spotify.json\n' +
		'Please read the following instructions carefully.\n\n' +
		'Please fill it with your information. Please fill in everything except the refresh token and auth code for now.\n' +
		'Your Client ID & Secret can be found at https://developer.spotify.com/dashboard/applications.\n' +
		'If you never created an Application through Spotify\'s Dashboard before you should search the internet for a guide on how to do so but it\'s actually not really hard BUT(!)\n' +
		'you MUST add \'https://example.com/callback\' as an redirect URL in your application!!!\n\n' +
		'Your username (that\'s not strictly the name you see in Spotify, sometimes it\'s just random characters) can be found at:\n' +
		'https://www.spotify.com/de/account/overview/\n' +
		'The password is just passed through to Librespot for Authentication. If you do not trust me (and you shouldn\'t) you can find the code of this bot here:\n' +
		'https://github.com/kbroschke/spoticord\n' +
		'If you open index.js you can search for \'PASSWORD\' and see for yourself that I\'m not doing anything funky with your password!\n' +
		'Please paste the full path to the librespot executable! (e.g. in my case it\'s \'/home/pi/librespot/target/release/librespot\'\n',
		'Now start the bot again!',
	);
	process.exit();
}

// load the server-specific prefixes
let prefixes;
try {
	console.log('Loading server specific prefixes...');
	prefixes = require('./config/prefixes.json');
	console.log('Prefixes loaded successfully!');
}
catch(err) {
	console.error('Error loading prefixes. Creating empty file.');
	fs.writeFileSync('./config/prefixes.json', '{}');
	console.error('If you have old data to import, stop the bot now and place your prefixes.json file back in the config directory.');
}

console.log('Initialization complete. Starting Librespot.');

// switch for turning librespot stream on and off
let LIBRESPOT_ACTIVE = false;

// start librespot
const librespot = spawn(
	spotify_config.LIBRESPOT_PATH,
	[
		'-n', 'Librespot',
		'--device-type', 'computer',
		'-b', '320',
		'-u', spotify_config.USERNAME,
		'-p', spotify_config.PASSWORD,
		'--backend', 'pipe',
	]);

librespot.stderr.pipe(process.stdout);

librespot.stdout.on('data', chunk => {
	if (!LIBRESPOT_ACTIVE) {
		return;
	}
	else {
		// TODO pipe or write chunk to discord
	}
});

librespot.on('error', error => {
	console.log(error);
});

// shorten config names that don't change and are needed often
const botID = discord_config.BOT_ID;
const spotifyOwnerDiscordID = discord_config.DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER;

let prefix;
let dispatcher;

const embedPing = new Discord.MessageEmbed().setColor('#1DB954').setTitle('Pong!');
const embedDescriptionOnly = new Discord.MessageEmbed().setColor('#1DB954');
const embedNow = new Discord.MessageEmbed().setColor('#1DB954');
const embedHelp = new Discord.MessageEmbed().setColor('#1DB954').setTitle('Command list & explanations');

function refreshSpotifyTokenCaller() {
	refreshSpotifyToken(spotify_config.REFRESH_TOKEN, spotify_config.CLIENT_ID, spotify_config.CLIENT_SECRET, res => {
		let response = '';

		res.on('data', data => {
			response += data;
		});

		res.on('end', () => {
			if (res.statusCode == 200) {
				spotifyAPI.setAccessToken(JSON.parse(response).access_token);
				console.log('Successfully updated Spotify Access Token!');
				spotifyAPI.getMe().then(
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
		const locked = discord_config.LOCKED;

		// get prefix from json
		if (message.guild != null) {
			if (message.guild.id in prefixes) {
				prefix = prefixes[message.guild.id];
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
				spotifyAPI.getMyCurrentPlaybackState().then(
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
				spotifyAPI.pause().then(
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
				spotifyAPI.pause().then(
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
			spotifyAPI.getMyCurrentPlayingTrack().then(
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
				prefixes[message.guild.id] = prefix;
				fs.writeFile('./config/prefixes.json', JSON.stringify(prefixes, null, 4), error => {
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
				setShuffle(true, message); // TODO fix this vgl. changelog spotify-web-api-node
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
			spotifyAPI.skipToNext().then(
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
			spotifyAPI.skipToPrevious().then(
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
					discord_config.LOCKED = true;
					fs.writeFile('./config/discord_config.json', JSON.stringify(discord_config, null, 4), error => {
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
					discord_config.LOCKED = false;
					fs.writeFile('./config/discord_config.json', JSON.stringify(discord_config, null, 4), error => {
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

		if (oldState.id == botID) {
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
		if (channelMembers.size == 1 && channelMembers.has(botID)) {
			channelMembers.get(botID).voice.connection.disconnect();
		}
	}
});

client.login(discord_config.BOT_TOKEN).then(() => {
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

function setShuffle(state, message) {
	spotifyAPI.setShuffle(state).then(
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
	spotifyAPI.setRepeat(option).then(
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
	spotifyAPI.search(query, [type], { limit : 5 }).then(
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

function initializePlayback(data, message) {
	// check if already in channel
	if (message.guild.voice && message.guild.voice.channel) {
		if (message.guild.voice.channel == message.member.voice.channel) {
			initSpotify(data, message, message.guild.voice.connection);
		}
		else {
			message.channel.send(embedDescriptionOnly.setDescription('Please join the bot\'s voice channel first.'));
		}
	}
	else {
		message.member.voice.channel.join().then(
			connection => {
				initSpotify(data, message, connection);
			},
		);
	}
}

function initSpotify(data, message, connection) {
	if (spotify_config.DEVICE_ID) {
		playSpotify(data, message, connection);
	}
	else {
		// get Device ID of Librespot in Spotify Connect
		spotifyAPI.getMyDevices().then(
			function(device_data) {
				// check for device with name 'Librespot'
				if (device_data.body.devices) {
					for (let index = 0; index < device_data.body.devices.length; index++) {
						if (device_data.body.devices[index].name == 'Librespot') {
							spotify_config.DEVICE_ID = device_data.body.devices[index].id;
							fs.writeFile('./config/spotify.json', JSON.stringify(spotify_config, null, 4), error => {
								if (error) {
									console.error('Failed writing Spotify Device ID. I\'ll try again next time.');
									console.error(error);
								}
							});
							playSpotify(data, message, connection);
						}
					}
				}
			},
			function(error) {
				console.error('--- ERROR WHILE GETTING DEVICES ---\n', error);
				message.channel.send(embedDescriptionOnly.setDescription('Playback could not be started. Please try again later.'));
			},
		);
	}
}

function playSpotify(data, message, connection) {
	if (data.body.device.id != spotify_config.DEVICE_ID) {
		spotifyAPI.transferMyPlayback(
			[spotify_config.DEVICE_ID],
			{ play: true },
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
		spotifyAPI.play().then(
			function() {
				play(message, connection);
				message.react('▶️');
			},
			function(error) {
				console.error('Playback error\n', error);
				message.channel.send(embedDescriptionOnly.setDescription('Playback could not be started. Please try again later.'));
			},
		);
	}
}

function play(message, connection) {
	LIBRESPOT_ACTIVE = true;

	dispatcher.on('error', error => {
		console.error('Dispatcher error', error);
	});

	dispatcher.on('finish', () => {
		console.log('Strean finished.');
	});
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

process.on('SIGINT', () => {
	console.log('Caught interrupt signal');
	// TODO disconnect all voice connections, stop librespot gracefully
	process.exit();
});