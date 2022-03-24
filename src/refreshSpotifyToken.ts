import https from "https";
import spotifyConfig from "../config/spotify.json";

export default {
	name: "refreshSpotifyToken",
	execute: async (): Promise<string> => {
		console.log("Refreshing Spotify's Access Token...");
		const data = new URLSearchParams({
			"grant_type": "refresh_token",
			"refresh_token": spotifyConfig.REFRESH_TOKEN,
		}).toString();
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

		return new Promise((resolve, reject) => {
			const req = https.request(options, (res) => {
				let response = "";

				res.on("data", (chunk) => {
					response += chunk;
				});

				res.on("end", () => {
					if (res.statusCode === 200) {
						resolve(JSON.parse(response).access_token);
					}
					else {
						console.error(
							"--- SPOTIFY API RESPONSE ERROR ---\n",
							`HTTPS status code: ${res.statusCode}\n`,
							"Response body:\n" + response);
						reject(res);
					}
				});

				res.on("error", (error) => {
					console.error(error);
					reject(error);
				});
			});

			req.on("error", (error) => {
				console.error("--- HTTPS ERROR ---\n" + error);
				reject(error);
			});

			req.write(data);
			req.end();
		});
	},
};
