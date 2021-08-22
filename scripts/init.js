console.log("Loading libraries...");
import { writeFileSync } from "fs";
import SpotifyWebApi from "spotify-web-api-node";
import strings from "./strings";
import discordConfig from "../config/discord.json";
import spotifyConfig from "../config/spotify.json";

// load discord config
console.log("Checking discord config...");

if (discordConfig.BOT_TOKEN) {
	console.log("Discord config complete!");
}
else {
	console.error("Error checking discord config, BOT_TOKEN is empty.\n" +
		"Generating default template...");
	const defaultConfig = {
		"BOT_TOKEN": "",
		// 'DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER': '',
	};
	writeFileSync("../config/discord.json",
		JSON.stringify(defaultConfig, null, 4));
	console.log(strings.discord.configNotFound);
	process.exit();
}

let spotifyAPI;

// load spotify config
console.log("Checking spotify config...");
if (spotifyConfig.CLIENT_ID &&
	spotifyConfig.CLIENT_SECRET &&
	spotifyConfig.USERNAME &&
	spotifyConfig.PASSWORD) {
	spotifyAPI = new SpotifyWebApi({
		clientId: spotifyConfig.CLIENT_ID,
		clientSecret: spotifyConfig.CLIENT_SECRET,
		redirectUri: "https://example.com/callback",
	});
	if (spotifyConfig.REFRESH_TOKEN) {
		console.log("Spotify config complete!");
	}
	else if (spotifyConfig.AUTH_CODE) {
		spotifyAPI.authorizationCodeGrant(spotifyConfig.AUTH_CODE).then(
			function(data) {
				spotifyConfig.REFRESH_TOKEN = data.body["refresh_token"];
				writeFileSync("../config/spotify.json",
					JSON.stringify(spotifyConfig, null, 4));
				console.log("Successfully updated refresh token!");
			},
			function(error) {
				console.error(error);
				console.log(strings.spotify.authError);
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
	console.log("A required parameter is missing. Please check the config file at config/spotify.json.");

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
	writeFileSync("../config/spotify.json",
		JSON.stringify(defaultConfig, null, 4));
	console.log(strings.spotify.configNotFound);
	process.exit();
}

console.log("Everything's ready, you can now start the bot with 'node .'!");
