"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("Loading libraries...");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const discord_js_1 = require("discord.js");
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const prism_media_1 = require("prism-media");
const refreshSpotifyToken_1 = __importDefault(require("./refreshSpotifyToken"));
const discord_json_1 = __importDefault(require("../config/discord.json"));
const spotify_json_1 = __importDefault(require("../config/spotify.json"));
const strings_js_1 = __importDefault(require("./strings.js"));
// load discord config
console.log("Checking discord config...");
if (discord_json_1.default.BOT_TOKEN) {
    console.log("Complete!");
}
else {
    console.log(strings_js_1.default.discord.configNotFoundRunning);
    process.exit();
}
// load spotify config
console.log("Checking spotify config...");
if (spotify_json_1.default.CLIENT_ID &&
    spotify_json_1.default.CLIENT_SECRET &&
    spotify_json_1.default.REFRESH_TOKEN &&
    spotify_json_1.default.USERNAME &&
    spotify_json_1.default.PASSWORD) {
    console.log("Complete!");
}
else {
    console.log(strings_js_1.default.spotify.configNotFoundRunning);
    process.exit();
}
const spotifyAPI = new spotify_web_api_node_1.default({
    clientId: spotify_json_1.default.CLIENT_ID,
    clientSecret: spotify_json_1.default.CLIENT_SECRET,
    redirectUri: "https://example.com/callback",
});
console.log("Initiliazing discord client...");
const client = new discord_js_1.Client();
client.commands = new discord_js_1.Collection();
const commandFiles = (0, fs_1.readdirSync)("./build/src/commands").filter((file) => file.endsWith(".js"));
const eventFilesDiscord = (0, fs_1.readdirSync)("./build/src/events/discord").filter((file) => file.endsWith(".js"));
const eventFilesLibrespot = (0, fs_1.readdirSync)("./build/src/events/librespot").filter((file) => file.endsWith(".js"));
const eventFilesProcess = (0, fs_1.readdirSync)("./build/src/events/process").filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
console.log("Initializing librespot...");
// random 4 digit number to identify client in Spotify
const librespotId = Math.floor(1000 + Math.random() * 9000);
const librespot = (0, child_process_1.spawn)("./lib/librespot", [
    "-n", `Spoticord#${librespotId}`,
    "--device-type", "computer",
    "-b", "320",
    "-u", spotify_json_1.default.USERNAME,
    "-p", spotify_json_1.default.PASSWORD,
    "-c", "./.cache",
    "--cache-size-limit", "1G",
    "--disable-discovery",
    "--backend", "pipe",
    "--initial-volume", "75",
    // '--passthrough', // TODO: raw ogg into ogg/opus for discord? (probably not)
    "--format", "S16",
    // "-v", // verbose debug logs
], { stdio: "pipe" });
// output librespot debug and error logs in console
librespot.stderr.pipe(process.stdout);
// FFmpeg instance to resample from Spotify's 44100Hz to Discord's/Opus' 48000Hz
const resampler = new prism_media_1.FFmpeg({
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
const opusEncoder = new prism_media_1.opus.Encoder({ frameSize: 480, channels: 2, rate: 48000 });
opusEncoder.on("error", (error) => {
    console.error(error);
});
// create pipeline
librespot.stdout.pipe(resampler).pipe(opusEncoder);
// events from discord client
for (const file of eventFilesDiscord) {
    const event = require(`./events/discord/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client, spotifyAPI, opusEncoder));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args, client, spotifyAPI, opusEncoder));
    }
}
// event from child_process librespot
for (const file of eventFilesLibrespot) {
    const event = require(`./events/librespot/${file}`);
    librespot.on(event.name, (...args) => event.execute(...args));
}
// events from process
for (const file of eventFilesProcess) {
    const event = require(`./events/process/${file}`);
    process.on(event.name, (...args) => event.execute(...args, client, librespot));
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
    refreshSpotifyToken_1.default.execute().then((accessToken) => {
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
                    if (element.name === `Spoticord#${librespotId}`) {
                        if (element.id) {
                            const spotifyConfigWithId = spotify_json_1.default;
                            spotifyConfigWithId.DEVICE_ID = element.id;
                            (0, fs_1.writeFileSync)("./build/config/spotify.json", JSON.stringify(spotifyConfigWithId, null, 4));
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
            }, (error) => {
                console.error("--- COULD NOT GET SPOTIFY DEVICE INFO ---\n", error);
            });
        }, (error) => {
            console.error("--- COULD NOT GET SPOTIFY AUTH INFO ---\n", error);
        });
    }, () => {
        // try again after 5 Minutes
        setTimeout(handleRefreshedSpotifyToken, 300000);
    });
}
client.login(discord_json_1.default.BOT_TOKEN).then(() => {
    console.log("Discord login complete.");
}).catch((error) => {
    console.error(error);
    console.error("Could not connect to Discord! Exiting.");
    process.kill(process.pid, "SIGINT");
});
