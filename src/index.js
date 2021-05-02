console.log('Loading libraries...');

const Discord = require('discord.js');
const fs = require('fs');
const SpotifyWebApi = require('spotify-web-api-node');
const { spawn } = require('child_process');
const https = require('https');
const querystring = require('querystring');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}

// create config dir if not exists
if (!fs.existsSync('../config')) {
	fs.mkdirSync('../config');
}

// load discord config
let BOT_TOKEN;
try {
	console.log('Loading discord config...');
	BOT_TOKEN = require('../config/discord.json').BOT_TOKEN;
	if (BOT_TOKEN) {
		console.log('Discord config loaded successfully!');
	}
	else {
		console.log('Can\'t load config file! BOT_TOKEN is empty.');
		process.exit();
	}
}
catch(error) {
	console.error('Error loading discord config.\nGenerating default template...');
	const default_config = {
		'BOT_TOKEN': '',
		// 'DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER': '',
	};
	fs.writeFileSync('../config/discord.json', JSON.stringify(default_config, null, 4));
	console.log(
		'The template was saved to ../config/discord.json\n' +
		'Please fill it with your information. Only the bot\'s token is required for the bot to work.\n' +
		'It can be found at https://discord.com/developers/applications (under Bot > Token).\n' +
		// 'The DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER can be left as an empty String if the feature for locking the bot is not needed.\n' +
		'Then start the bot again!',
	);
	process.exit();
}

let spotifyAPI;

// load spotify config
let spotify_config;
try {
	console.log('Loading spotify config...');
	spotify_config = require('../config/spotify.json');
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
					fs.writeFileSync('../config/spotify.json', JSON.stringify(spotify_config, null, 4));
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
		console.log('Can\'t load config file! A required parameter is missing. Please check the config file at ../config/spotify.json.');
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
	fs.writeFileSync('../config/spotify.json', JSON.stringify(default_config, null, 4));
	console.log(
		'The template was saved to ../config/spotify.json\n' +
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
	prefixes = require('../config/prefixes.json');
	console.log('Prefixes loaded successfully!');
}
catch(err) {
	console.error('Error loading prefixes. Creating empty file.');
	fs.writeFileSync('../config/prefixes.json', '{}');
	console.error('If you have old data to import, stop the bot now and place your prefixes.json file back in the config directory.');
}

console.log('Initialization complete. Starting Librespot.');

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
		'--initial-volume', 80,
		// '--passthrough', // TODO: raw ogg into ogg/opus for discord?
		'-v',
	]);

librespot.stderr.pipe(process.stdout);
// TODO fetch device_id when lirebspot has started on every startup

let stop = false;
librespot.stdout.on('data', chunk => {
	if (!stop) {
		console.log('---\n', chunk, '\n---');
		fs.writeFileSync('chunk.txt', chunk);
		// Experiment success: size of 1 chunk is 4096 Bytes
		stop = true;
	}
	else {
		return;
	}
});

librespot.on('error', error => {
	console.log(error);
});

librespot.on('exit', code => {
	console.log(`Librespot exited with code ${code}!`);
	if (code == 0) {
		console.log('Stopping bot... Bye!');
		process.exit(0);
	}
	else {
		console.error(`--- LIBRESPOT EXITED WITH ERROR CODE ${code} ---\nIf you want to stop the bot press CTRL-Z!`);
	}
});

// every spotify access_token is valid for 3600 sec (60min)
// setInterval: refresh the access_token every ~50min
setInterval(refreshSpotifyToken, 3000000);
// call it for first time, so we have access right away and not in 50 min...
refreshSpotifyToken();


// Incoming message event
client.on('message', async message => {
	// dont react to other Bots
	if (message.author.bot) return;

	// get prefix from json values
	let prefix;
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
	let commandFull = message.content.trim();

	if (commandFull.startsWith(prefix)) {
		// remove prefix if there
		commandFull = message.content.slice(prefix.length);
	}
	else if (message.mentions.has(client.user)) {
		// remove mention from front (no regrets :D  -> idea for smarter filter: mentions includes message.author.id )
		commandFull = message.content.slice(client.user.id.length + 4);
	}
	else {return;}

	// remove possible whitespaces between prefix and command
	commandFull = commandFull.trim();

	// split message into array
	const args = commandFull.split(/ +/);
	// remove command from other arguments
	const command = args.shift().toLowerCase();

	if (!client.commands.has(command)) return;

	try {
		client.commands.get(command).execute(message, args, spotifyAPI);
	}
	catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

client.once('ready', () => {
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

		if (oldState.id == client.user.id) {
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
		if (channelMembers.size == 1 && channelMembers.has(client.user.id)) {
			channelMembers.get(client.user.id).voice.connection.disconnect();
			// TODO pause Spotify
		}
	}
});

process.on('SIGINT', () => {
	// logout from discord (that also ends all voice connections :ok_hand:)
	client.destroy();

	// stop librespot gracefully (send CTRL-C)
	console.log('\nShutting down librespot...');
	librespot.stdin.write('\x03');

	// don't exit the process here, if shut down gracefully librespot.on('exit') listener will call process.exit()
});

client.login(BOT_TOKEN).then(() => {
	console.log('Discord login complete.');
});

function refreshSpotifyToken() {
	console.log('Refreshing Spotify\'s Access Token...');
	const data = querystring.stringify({
		'grant_type': 'refresh_token',
		'refresh_token': spotify_config.REFRESH_TOKEN,
	});
	const auth = 'Basic ' + new Buffer.from(`${spotify_config.CLIENT_ID}:${spotify_config.CLIENT_SECRET}`).toString('base64');
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

	const req = https.request(options, res => {
		let response = '';

		res.on('data', chunk => {
			response += chunk;
		});

		res.on('end', () => {
			if (res.statusCode == 200) {
				spotifyAPI.setAccessToken(JSON.parse(response).access_token);
				console.log('Successfully updated Spotify Access Token!');
				spotifyAPI.getMe().then(
					function(spotify_api_data) {
						console.log('Authenticated with Spotify Api as:', spotify_api_data.body.email);
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

	req.on('error', error => {
		console.error('--- HTTPS ERROR ---\n' + error);
	});

	req.write(data);
	req.end();
}