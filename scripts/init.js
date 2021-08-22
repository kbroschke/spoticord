console.log("Loading libraries...");
const fs = require("fs");
const SpotifyWebApi = require("spotify-web-api-node");
const strings = require("./strings");
const discordConfig = require("../config/discord.json");
const spotifyConfig = require("../config/spotify.json");

// load discord config
console.log("Checking discord config...");

if (discordConfig.BOT_TOKEN) {
	console.log("Discord config complete!");
}
else {
	console.error("Error checking discord config, BOT_TOKEN is empty.");
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
				fs.writeFileSync("./config/spotify.json",
					JSON.stringify(spotifyConfig, null, 4));
				console.log("Successfully updated refresh token!");
				console.log("Everything's ready, you can now start the bot with 'node .'!");
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
	console.log(strings.spotify.configNotFound);
	process.exit();
}
