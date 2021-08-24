console.log("Loading libraries...");
import { readdirSync, writeFileSync } from "fs";
import { spawn } from "child_process";
import { Client, Collection } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import refreshSpotifyToken from "./refreshSpotifyToken";
import discordConfig from "../config/discord.json";
import spotifyConfig from "../config/spotify.json";
import { ClientCommands } from "ClientCommands";
import strings from "./strings.js";

// load discord config
console.log("Checking discord config...");

if (discordConfig.BOT_TOKEN) {
	console.log("Complete!");
}
else {
	console.log(strings.discord.configNotFoundRunning);
	process.exit();
}

// load spotify config
console.log("Checking spotify config...");
if (spotifyConfig.CLIENT_ID &&
	spotifyConfig.CLIENT_SECRET &&
	spotifyConfig.REFRESH_TOKEN &&
	spotifyConfig.USERNAME &&
	spotifyConfig.PASSWORD) {
	console.log("Complete!");
}
else {
	console.log(strings.spotify.configNotFoundRunning);
	process.exit();
}

const spotifyAPI = new SpotifyWebApi({
	clientId: spotifyConfig.CLIENT_ID,
	clientSecret: spotifyConfig.CLIENT_SECRET,
	redirectUri: "https://example.com/callback",
});

console.log("Initiliazing discord client...");
const client = new Client() as Client & ClientCommands;
client.commands = new Collection();

const commandFiles = readdirSync("./build/src/commands").filter((file) => file.endsWith(".js"));
const eventFilesDiscord = readdirSync("./build/src/events/discord").filter((file) => file.endsWith(".js"));
const eventFilesLibrespot = readdirSync("./build/src/events/librespot").filter((file) => file.endsWith(".js"));
const eventFilesProcess = readdirSync("./build/src/events/process").filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

console.log("Initializing librespot...");

// random 4 digit number to identify client in Spotify
const librespotId = Math.floor(1000 + Math.random() * 9000);

const librespot = spawn(
	"./lib/librespot",
	[
		"-n", `Spoticord#${librespotId}`,
		"--device-type", "computer",
		"-b", "320",
		"-u", spotifyConfig.USERNAME,
		"-p", spotifyConfig.PASSWORD,
		"--backend", "pipe",
		"--initial-volume", "80",
		// '--passthrough', // TODO: raw ogg into ogg/opus for discord?
		"-v",
	],
	{ stdio: "pipe" });

for (const file of eventFilesDiscord) {
	const event = require(`./events/discord/${file}`);
	if (event.once) {
		client.once(event.name,
			(...args) => event.execute(...args, client, spotifyAPI, librespot));
	}
	else {
		client.on(event.name,
			(...args) => event.execute(...args, client, spotifyAPI, librespot));
	}
}

for (const file of eventFilesLibrespot) {
	const event = require(`./events/librespot/${file}`);
	librespot.on(event.name,
		(...args) => event.execute(...args));
}

for (const file of eventFilesProcess) {
	const event = require(`./events/process/${file}`);
	process.on(event.name,
		(...args) => event.execute(...args, client, librespot));
}

librespot.stderr.pipe(process.stdout);
// TODO fetch device_id when lirebspot has started on every startup

// librespot.stdout.on('data', () => {});
// Experiment success: size of 1 chunk is 4096 Bytes

// every spotify access_token is valid for 3600 sec (60min)
// setInterval: refresh the access_token every ~50min
setInterval(() => refreshSpotifyToken.execute(spotifyAPI), 3000000);
// call it for first time, so we have access right away and not in 50 min...
refreshSpotifyToken.execute(spotifyAPI).then(
	function() {
		// get device id from Spotify
		console.log("Getting device_id from Spotify...");
		spotifyAPI.getMyDevices().then((response) => {
			const devices = response.body.devices;
			devices.forEach((element) => {
				if (element.name === `Spoticord#${librespotId}`) {
					if (element.id) {
						const spotifyConfigWithId = spotifyConfig;
						spotifyConfigWithId.DEVICE_ID = element.id;
						writeFileSync("../config/spotify.json", JSON.stringify(spotifyConfigWithId, null, 4));
					}
					else {
						console.error("Librespot client was not found, exiting!");
						process.kill(process.pid, "SIGINT");
					}
				}
			});
		});
	},
	function(error) {
		// setTimeout(() => refreshSpotifyToken.execute(spotifyAPI));
	},
);

client.login(discordConfig.BOT_TOKEN).then(() => {
	console.log("Discord login complete.");
}).catch((error) => {
	console.error(error);
	console.error("Could not connect to Discord! Exiting.");
	process.kill(process.pid, "SIGINT");
});
