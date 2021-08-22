import https from "https";
import querystring from "querystring";
import SpotifyWebApi from "spotify-web-api-node";
import spotifyConfig from "../config/spotify.json";

export default {
	name: "refreshSpotifyToken",
	execute: (spotifyAPI: SpotifyWebApi) => {
		console.log("Refreshing Spotify's Access Token...");
		const data = querystring.stringify({
			"grant_type": "refresh_token",
			"refresh_token": spotifyConfig.REFRESH_TOKEN,
		});
		const auth = "Basic " + Buffer.from(`${spotifyConfig.CLIENT_ID}:${spotifyConfig.CLIENT_SECRET}`).toString("base64");
		const options = {
			hostname: "accounts.spotify.com",
			port: 443,
			path: "/api/token",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Content-Length": data.length,
				"Authorization": auth,
			},
		};

		const req = https.request(options, (res) => {
			let response = "";

			res.on("data", (chunk) => {
				response += chunk;
			});

			res.on("end", () => {
				if (res.statusCode == 200) {
					spotifyAPI.setAccessToken(
						JSON.parse(response).access_token);
					console.log("Successfully updated Spotify Access Token!");
					spotifyAPI.getMe().then(
						function(spotifyApiData) {
							console.log("Authenticated with Spotify Api as:", spotifyApiData.body.email);
						},
						function(error) {
							console.error("--- ERROR INITIALIZING SPOTIFY WEB API ---\n", error);
						},
					);
				}
				else {
					console.error(
						"--- SPOTIFY API RESPONSE ERROR ---\n",
						`HTTPS status code: ${res.statusCode}\n`,
						"Response body:\n" + response);
				}
			});

			res.on("error", (error) => {
				console.error(error);
			});
		});

		req.on("error", (error) => {
			console.error("--- HTTPS ERROR ---\n" + error);
		});

		req.write(data);
		req.end();
	},
};
