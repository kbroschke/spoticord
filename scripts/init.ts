console.log("Loading libraries...");
import fs from "fs";
import SpotifyWebApi from "spotify-web-api-node";
import strings from "../src/strings";
import discordConfig from "../config/discord.json";
import spotifyConfig from "../config/spotify.json";

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

let spotifyAPI: SpotifyWebApi;

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
		testLogin(spotifyAPI);
	}
	else if (spotifyConfig.AUTH_CODE) {
		spotifyAPI.authorizationCodeGrant(spotifyConfig.AUTH_CODE).then(
			function(data) {
				spotifyConfig.REFRESH_TOKEN = data.body["refresh_token"];
				fs.writeFileSync("./config/spotify.json",
					JSON.stringify(spotifyConfig, null, 4));
				console.log("Successfully updated refresh token!");
				testLogin(spotifyAPI);
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
		console.log(spotifyAPI.createAuthorizeURL(scopes, "DO_NOT_COPY_THIS_PART"));
		process.exit();
	}
}
else {
	console.log(strings.spotify.configNotFound);
	process.exit();
}

/** Extracted login test because it's used multiple times.
 * @param {SpotifyWebApi} spotifyAPI - API instance to test
 */
function testLogin(spotifyAPI: SpotifyWebApi) {
	spotifyAPI.getMe().then(
		(profile) => {
			console.log(`Logged in as ${profile.body.email}.`);
		},
		(response) => {
			console.log(strings.spotify.loginError);
			console.log(response);
		});
}
