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
const refreshSpotifyToken_1 = __importDefault(require("./refreshSpotifyToken"));
const discord_json_1 = __importDefault(require("../config/discord.json"));
const spotify_json_1 = __importDefault(require("../config/spotify.json"));
const strings_js_1 = __importDefault(require("strings.js"));
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
const commandFiles = fs_1.readdirSync("./commands").filter((file) => file.endsWith(".js"));
const eventFilesDiscord = fs_1.readdirSync("./events/discord").filter((file) => file.endsWith(".js"));
const eventFilesLibrespot = fs_1.readdirSync("./events/librespot").filter((file) => file.endsWith(".js"));
const eventFilesProcess = fs_1.readdirSync("./events/process").filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
console.log("Initializing librespot...");
// random 4 digit number to identify client in Spotify
const librespotId = Math.floor(1000 + Math.random() * 9000);
const librespot = child_process_1.spawn("../lib/librespot", [
    "-n", `Spoticord#${librespotId}`,
    "--device-type", "computer",
    "-b", "320",
    "-u", spotify_json_1.default.USERNAME,
    "-p", spotify_json_1.default.PASSWORD,
    "--backend", "pipe",
    "--initial-volume", "80",
    // '--passthrough', // TODO: raw ogg into ogg/opus for discord?
    "-v",
], { stdio: "pipe" });
for (const file of eventFilesDiscord) {
    const event = require(`./events/discord/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client, spotifyAPI, librespot));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args, client, spotifyAPI, librespot));
    }
}
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
setInterval(() => refreshSpotifyToken_1.default.execute(spotifyAPI), 3000000);
// call it for first time, so we have access right away and not in 50 min...
refreshSpotifyToken_1.default.execute(spotifyAPI);
client.login(discord_json_1.default.BOT_TOKEN).then(() => {
    console.log("Discord login complete.");
}).catch((error) => {
    console.error(error);
    console.error("Could not connect to Discord! Exiting.");
    process.exit();
});
// get device id from Spotify
spotifyAPI.getMyDevices().then((response) => {
    const devices = response.body.devices;
    devices.forEach((element) => {
        if (element.name === `Spoticord#${librespotId}`) {
            if (element.id) {
                const spotifyConfigWithId = spotify_json_1.default;
                spotifyConfigWithId.DEVICE_ID = element.id;
                fs_1.writeFileSync("../config/spotify.json", JSON.stringify(spotifyConfigWithId, null, 4));
            }
            else {
                console.error("Librespot client was not found, exiting!");
                process.kill(process.pid, "SIGINT");
            }
        }
    });
});
