console.log("Loading libraries...");
import { existsSync, mkdirSync, writeFileSync, readdirSync } from "fs";
import { spawn } from "child_process";
import { Client, Collection } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import refreshSpotifyToken from "./refreshSpotifyToken";
import strings from "./strings";
import discordConfig from "../config/discord.json";
import spotifyConfig from "../config/spotify.json";

console.log("Loading configs...");
// create config dir if not exists
if (!existsSync("../config")) {
	mkdirSync("../config");
}

// load discord config
console.log("Loading discord config...");

if (discordConfig.BOT_TOKEN) {
	console.log("Discord config loaded successfully!");
}
else {
	console.error("Error loading discord config, BOT_TOKEN is empty.\n" +
		"Generating default template...");
	const defaultConfig = {
		"BOT_TOKEN": "",
		// 'DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER': '',
	};
	writeFileSync("../config/discord.json", JSON.stringify(defaultConfig, null, 4));
	console.log(strings.discord.configNotFound);
	process.exit();
}


let spotifyAPI: SpotifyWebApi;

// load spotify config
console.log("Loading spotify config...");
if (spotifyConfig.CLIENT_ID &&
	spotifyConfig.CLIENT_SECRET &&
	spotifyConfig.USERNAME &&
	spotifyConfig.PASSWORD &&
	spotifyConfig.LIBRESPOT_PATH) {
	spotifyAPI = new SpotifyWebApi({
		clientId: spotifyConfig.CLIENT_ID,
		clientSecret: spotifyConfig.CLIENT_SECRET,
		redirectUri: "https://example.com/callback",
	});
	if (spotifyConfig.REFRESH_TOKEN) {
		console.log("Spotify config loaded successfully!");
	}
	else if (spotifyConfig.AUTH_CODE) {
		spotifyAPI.authorizationCodeGrant(spotifyConfig.AUTH_CODE).then(
			function(data) {
				spotifyConfig.REFRESH_TOKEN = data.body["refresh_token"];
				writeFileSync("../config/spotify.json", JSON.stringify(spotifyConfig, null, 4));
				console.log("Successfully updated refresh token!");
				console.log("Please start the bot again. (I promise, this should be the last time)");
				process.exit();
			},
			function(error) {
				console.error(error);
				console.log(
					"Something went wrong while sending the auth code to Spotify.\n" +
					"Please make sure to paste the whole code you got in the redirect URL.\n" +
					"If you need a new auth code, just remove the current one from the config file and start the bot again.",
				);
				process.exit();
			},
		);
	}
	else {
		console.log(strings.spotify.noRefreshToken);
		const scopes = [
			"user-read-email",
			"user-read-private",
			"user-read-playback-state",
			"user-modify-playback-state",
			"user-read-currently-playing",
		];
		console.log(spotifyAPI.createAuthorizeURL(scopes, ""));
		process.exit();
	}
}
else {
	console.log("Can't load config file! A required parameter is missing. Please check the config file at ../config/spotify.json.");

	// TODO fix
	console.error("Error loading spotify config. Generating default template...");
	const defaultConfig = {
		"CLIENT_ID": "",
		"CLIENT_SECRET": "",
		"REFRESH_TOKEN": "",
		"AUTH_CODE": "",
		"USERNAME": "",
		"PASSWORD": "",
		"LIBRESPOT_PATH": "",
	};
	writeFileSync("../config/spotify.json", JSON.stringify(defaultConfig, null, 4));
	console.log(strings.spotify.configNotFound);
	process.exit();
}

// make sure proper prefix-file exists
if (!existsSync("../config/prefixes.json")) {
	writeFileSync("../config/prefixes.json", "{}");
}

type ClientCommands = { commands: Collection<any, any> };

console.log("Initiliazing discord client...");
const client = new Client() as Client & ClientCommands;
client.commands = new Collection();

const commandFiles = readdirSync("./commands").filter(file => file.endsWith(".js"));
const eventFilesDiscord = readdirSync("./events/discord").filter(file => file.endsWith(".js"));
const eventFilesLibrespot = readdirSync("./events/librespot").filter(file => file.endsWith(".js"));
const eventFilesProcess = readdirSync("./events/process").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

for (const file of eventFilesDiscord) {
	const event = require(`./events/discord/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client, spotifyAPI));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args, client, spotifyAPI));
	}
}

console.log("Initializing librespot...");

const librespot = spawn(
	spotifyConfig.LIBRESPOT_PATH,
	[
		"-n", "Librespot",
		"--device-type", "computer",
		"-b", "320",
		"-u", spotifyConfig.USERNAME,
		"-p", spotifyConfig.PASSWORD,
		"--backend", "pipe",
		"--initial-volume", "80",
		// '--passthrough', // TODO: raw ogg into ogg/opus for discord?
		"-v",
	]);

for (const file of eventFilesLibrespot) {
	const event = require(`./events/librespot/${file}`);
	librespot.on(event.name, (...args) => event.execute(...args));
}

for (const file of eventFilesProcess) {
	const event = require(`./events/process/${file}`);
	process.on(event.name, (...args) => event.execute(...args, client, librespot));
}

librespot.stderr.pipe(process.stdout);
// TODO fetch device_id when lirebspot has started on every startup

// librespot.stdout.on('data', () => {});
// Experiment success: size of 1 chunk is 4096 Bytes

// every spotify access_token is valid for 3600 sec (60min)
// setInterval: refresh the access_token every ~50min
setInterval(() => refreshSpotifyToken.execute(spotifyAPI), 3000000);
// call it for first time, so we have access right away and not in 50 min...
refreshSpotifyToken.execute(spotifyAPI);

client.login(discordConfig.BOT_TOKEN).then(() => {
	console.log("Discord login complete.");
}).catch(error => {
	console.error(error);
	console.error("Could not connect to Discord! Exiting.");
	process.exit();
});
