console.log("Loading libraries...");
import { readdirSync, writeFileSync } from "fs";
import { spawn } from "child_process";
import { Client, Collection, Intents } from "discord.js";
import { createAudioPlayer, NoSubscriberBehavior, createAudioResource, StreamType } from "@discordjs/voice";
import SpotifyWebApi from "spotify-web-api-node";
import { FFmpeg, opus } from "prism-media";
import refreshSpotifyToken from "./refreshSpotifyToken";
import discordConfig from "../config/discord.json";
import spotifyConfig from "../config/spotify.json";
import strings from "./strings.js";
import type { Command, CommandClient } from "types/command";
import type { Event } from "types/event";

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

// initialize globals
console.log("Initiliazing spotify API...");
const spotifyAPI = new SpotifyWebApi({
	clientId: spotifyConfig.CLIENT_ID,
	clientSecret: spotifyConfig.CLIENT_SECRET,
	redirectUri: "https://example.com/callback",
});

console.log("Initiliazing discord client...");
const client = new Client({ intents:
	[
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
}) as CommandClient;
client.commands = new Collection();

console.log("Initializing librespot...");
const librespot = spawn(
	"./lib/librespot",
	[
		"-n", "Spoticord",
		"--device-type", "computer",
		"-b", "320",
		"-u", spotifyConfig.USERNAME,
		"-p", spotifyConfig.PASSWORD,
		"-c", "./.cache",
		"--cache-size-limit", "1G",
		"--disable-discovery",
		"--backend", "pipe",
		"--initial-volume", "75",
		// '--passthrough', // TODO: raw ogg into ogg/opus for discord? (probably not)
		"--format", "S16",
		// "-v", // verbose debug logs
	],
	{ stdio: "pipe" },
);
// output librespot debug and error logs in console
librespot.stderr.pipe(process.stdout);

console.log("Initializing audio player...");
const player = createAudioPlayer({
	behaviors: { noSubscriber: NoSubscriberBehavior.Play },
});
player.on("error", (error) => {
	console.error("ERROR: player error", error);
});

// FFmpeg instance to resample from Spotify's 44100Hz to Discord's/Opus' 48000Hz
const resampler = new FFmpeg({
	args: [
		"-analyzeduration", "0",
		"-loglevel", "0",
		"-f", "s16le",
		"-ar", "44100",
		"-ac", "2",
		"-re",
		"-i", "-",
		"-f", "s16le",
		"-ar", "48000",
		"-ac", "2",
		"-af", "aresample=resampler=soxr",
	], shell: true,
});
resampler.on("error", (error) => {
	console.error(error);
});

// encode resampled PCM-data into opus packets
const opusEncoder = new opus.Encoder(
	{ frameSize: 480, channels: 2, rate: 48000 });

opusEncoder.on("error", (error) => {
	console.error(error);
});

// create pipeline
librespot.stdout.pipe(resampler);
// .pipe(opusEncoder);

const resource = createAudioResource(resampler, {
	inputType: StreamType.Raw,
});

player.play(resource);

// load commands and events
const commandFiles = readdirSync("./src/commands").filter((file) => file.endsWith(".js"));
const eventFilesDiscord = readdirSync("./src/events/discord").filter((file) => file.endsWith(".js"));
const eventFilesLibrespot = readdirSync("./src/events/librespot").filter((file) => file.endsWith(".js"));
const eventFilesProcess = readdirSync("./src/events/process").filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command: Command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
	console.log(`Registered command: '${command.data.name}'`);
}

// events from discord client
for (const file of eventFilesDiscord) {
	const event: Event = require(`./events/discord/${file}`);
	if (event.once) {
		client.once(event.data.name,
			async (...args) => {
				console.log("EVENT: discord client (once)", event.data.name);
				event.execute(...args, client, spotifyAPI, player);
			},
		);
		console.log(
			`Registered discord client (once) event: '${event.data.name}'`);
	}
	else {
		client.on(event.data.name,
			async (...args) => {
				console.log("EVENT: discord client (on)", event.data.name);
				event.execute(...args, client, spotifyAPI, player);
			},
		);
		console.log(
			`Registered discord client (on) event: '${event.data.name}'`);
	}
}

// event from child_process librespot
for (const file of eventFilesLibrespot) {
	const event: Event = require(`./events/librespot/${file}`);
	librespot.on(event.data.name,
		async (...args) => {
			console.log("EVENT: librespot child_process", event.data.name);
			event.execute(...args);
		},
	);
	console.log(`Registered librespot event: '${event.data.name}'`);
}

// events from process
for (const file of eventFilesProcess) {
	const event: Event = require(`./events/process/${file}`);
	process.on(event.data.name,
		async (...args) => {
			console.log("EVENT: process", event.data.name);
			event.execute(...args, client, librespot, player);
		},
	);
	console.log(`Registered process event: '${event.data.name}'`);
}

// every spotify access_token is valid for 3600 sec (60min)
// setInterval: refresh the access_token every ~50min
setInterval(handleRefreshedSpotifyToken, 3000000);
// call it for first time, so we have access right away and not in 50 min...
handleRefreshedSpotifyToken();

/**
 * wrapper for async handling of refreshed Spotify access token
 */
function handleRefreshedSpotifyToken() {
	refreshSpotifyToken.execute().then(
		(accessToken) => {
			spotifyAPI.setAccessToken(accessToken);
			console.log("Successfully updated Spotify Access Token!");

			// check if accessToken is valid
			spotifyAPI.getMe().then((response) => {
				console.log("Authenticated with Spotify API as:", response.body.email);

				// get device id from Spotify
				console.log("Getting device_id from Spotify...");
				spotifyAPI.getMyDevices().then((response) => {
					const devices = response.body.devices;
					let deviceNotFound = true;
					devices.forEach((element) => {
						if (element.name === "Spoticord") {
							if (element.id) {
								const spotifyConfigWithId = spotifyConfig;
								spotifyConfigWithId.DEVICE_ID = element.id;
								writeFileSync("./config/spotify.json", JSON.stringify(spotifyConfigWithId, null, 4));
								console.log("Saved device id from Spotify!");
								deviceNotFound = false;
							}
						}
					});
					if (deviceNotFound) {
						// try again in 5 sec
						console.log("Did not find Librespot device in Spotify. Trying again in 5 sec.");
						setTimeout(handleRefreshedSpotifyToken, 5000);

						// make not constant 5 sec but fibonacci numbers until too much then call
						// console.error("Librespot client was not found, exiting!"); and
						// process.kill(process.pid, "SIGINT"););
					}
				},
				(error) => {
					console.error("--- COULD NOT GET SPOTIFY DEVICE INFO ---\n", error);
				});
			},
			(error) => {
				console.error("--- COULD NOT GET SPOTIFY AUTH INFO ---\n", error);
			});
		},
		() => {
			// try again after 5 Minutes
			setTimeout(handleRefreshedSpotifyToken, 300000);
		},
	);
}

client.login(discordConfig.BOT_TOKEN).then(() => {
	console.log("Discord login complete.");
}).catch((error) => {
	console.error(error);
	console.error("Could not connect to Discord! Exiting.");
	process.kill(process.pid, "SIGINT");
});
