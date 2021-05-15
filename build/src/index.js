"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('Loading libraries...');
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const discord_js_1 = require("discord.js");
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const refreshSpotifyToken_1 = __importDefault(require("./refreshSpotifyToken"));
const strings_1 = __importDefault(require("./strings"));
const discord_json_1 = __importDefault(require("../config/discord.json"));
const spotify_json_1 = __importDefault(require("../config/spotify.json"));
console.log('Loading configs...');
// create config dir if not exists
if (!fs_1.existsSync('../config')) {
    fs_1.mkdirSync('../config');
}
// load discord config
console.log('Loading discord config...');
if (discord_json_1.default.BOT_TOKEN) {
    console.log('Discord config loaded successfully!');
}
else {
    console.error('Error loading discord config, BOT_TOKEN is empty.\n' +
        'Generating default template...');
    const default_config = {
        'BOT_TOKEN': '',
        // 'DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER': '',
    };
    fs_1.writeFileSync('../config/discord.json', JSON.stringify(default_config, null, 4));
    console.log(strings_1.default.discord.configNotFound);
    process.exit();
}
let spotifyAPI;
// load spotify config
console.log('Loading spotify config...');
if (spotify_json_1.default.CLIENT_ID &&
    spotify_json_1.default.CLIENT_SECRET &&
    spotify_json_1.default.USERNAME &&
    spotify_json_1.default.PASSWORD &&
    spotify_json_1.default.LIBRESPOT_PATH) {
    spotifyAPI = new spotify_web_api_node_1.default({
        clientId: spotify_json_1.default.CLIENT_ID,
        clientSecret: spotify_json_1.default.CLIENT_SECRET,
        redirectUri: 'https://example.com/callback',
    });
    if (spotify_json_1.default.REFRESH_TOKEN) {
        console.log('Spotify config loaded successfully!');
    }
    else if (spotify_json_1.default.AUTH_CODE) {
        spotifyAPI.authorizationCodeGrant(spotify_json_1.default.AUTH_CODE).then(function (data) {
            spotify_json_1.default.REFRESH_TOKEN = data.body['refresh_token'];
            fs_1.writeFileSync('../config/spotify.json', JSON.stringify(spotify_json_1.default, null, 4));
            console.log('Successfully updated refresh token!');
            console.log('Please start the bot again. (I promise, this should be the last time)');
            process.exit();
        }, function (error) {
            console.error(error);
            console.log('Something went wrong while sending the auth code to Spotify.\n' +
                'Please make sure to paste the whole code you got in the redirect URL.\n' +
                'If you need a new auth code, just remove the current one from the config file and start the bot again.');
            process.exit();
        });
    }
    else {
        console.log(strings_1.default.spotify.noRefreshToken);
        const scopes = [
            'user-read-email',
            'user-read-private',
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-read-currently-playing',
        ];
        console.log(spotifyAPI.createAuthorizeURL(scopes, ''));
        process.exit();
    }
}
else {
    console.log('Can\'t load config file! A required parameter is missing. Please check the config file at ../config/spotify.json.');
    // TODO fix
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
    fs_1.writeFileSync('../config/spotify.json', JSON.stringify(default_config, null, 4));
    console.log(strings_1.default.spotify.configNotFound);
    process.exit();
}
// make sure proper prefix-file exists
if (!fs_1.existsSync('../config/prefixes.json')) {
    fs_1.writeFileSync('../config/prefixes.json', '{}');
}
console.log('Initiliazing discord client...');
const client = new discord_js_1.Client();
client.commands = new discord_js_1.Collection();
const commandFiles = fs_1.readdirSync('./commands').filter(file => file.endsWith('.js'));
const eventFilesDiscord = fs_1.readdirSync('./events/discord').filter(file => file.endsWith('.js'));
const eventFilesLibrespot = fs_1.readdirSync('./events/librespot').filter(file => file.endsWith('.js'));
const eventFilesProcess = fs_1.readdirSync('./events/process').filter(file => file.endsWith('.js'));
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
console.log('Initializing librespot...');
const librespot = child_process_1.spawn(spotify_json_1.default.LIBRESPOT_PATH, [
    '-n', 'Librespot',
    '--device-type', 'computer',
    '-b', '320',
    '-u', spotify_json_1.default.USERNAME,
    '-p', spotify_json_1.default.PASSWORD,
    '--backend', 'pipe',
    '--initial-volume', '80',
    // '--passthrough', // TODO: raw ogg into ogg/opus for discord?
    '-v',
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
setInterval(() => refreshSpotifyToken_1.default.execute(spotifyAPI), 3000000);
// call it for first time, so we have access right away and not in 50 min...
refreshSpotifyToken_1.default.execute(spotifyAPI);
client.login(discord_json_1.default.BOT_TOKEN).then(() => {
    console.log('Discord login complete.');
});
