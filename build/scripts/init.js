"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("Loading libraries...");
const fs_1 = __importDefault(require("fs"));
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const strings_1 = __importDefault(require("../src/strings"));
const discord_json_1 = __importDefault(require("../config/discord.json"));
const spotify_json_1 = __importDefault(require("../config/spotify.json"));
// load discord config
console.log("Checking discord config...");
if (discord_json_1.default.BOT_TOKEN) {
    console.log("Discord config complete!");
}
else {
    console.error("Error checking discord config, BOT_TOKEN is empty.");
    console.log(strings_1.default.discord.configNotFound);
    process.exit();
}
let spotifyAPI;
// load spotify config
console.log("Checking spotify config...");
if (spotify_json_1.default.CLIENT_ID &&
    spotify_json_1.default.CLIENT_SECRET &&
    spotify_json_1.default.USERNAME &&
    spotify_json_1.default.PASSWORD) {
    spotifyAPI = new spotify_web_api_node_1.default({
        clientId: spotify_json_1.default.CLIENT_ID,
        clientSecret: spotify_json_1.default.CLIENT_SECRET,
        redirectUri: "https://example.com/callback",
    });
    if (spotify_json_1.default.REFRESH_TOKEN) {
        console.log("Spotify config complete!");
    }
    else if (spotify_json_1.default.AUTH_CODE) {
        spotifyAPI.authorizationCodeGrant(spotify_json_1.default.AUTH_CODE).then(function (data) {
            spotify_json_1.default.REFRESH_TOKEN = data.body["refresh_token"];
            fs_1.default.writeFileSync("./build/config/spotify.json", JSON.stringify(spotify_json_1.default, null, 4));
            console.log("Successfully updated refresh token!");
            console.log("Everything's ready, you can now start the bot with 'node .'!");
        }, function (error) {
            console.error(error);
            console.log(strings_1.default.spotify.authError);
            process.exit();
        });
    }
    else {
        console.log(strings_1.default.spotify.noRefreshToken);
        const scopes = [
            "user-read-email",
            "user-read-private",
            "user-read-playback-state",
            "user-modify-playback-state",
            "user-read-currently-playing",
        ];
        console.log(spotifyAPI.createAuthorizeURL(scopes, "DO NOT COPY THIS PART"));
        process.exit();
    }
}
else {
    console.log("A required parameter is missing. Please check the config file at config/spotify.json.");
    console.log(strings_1.default.spotify.configNotFound);
    process.exit();
}
