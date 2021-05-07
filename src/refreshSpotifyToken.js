const https = require('https');
const querystring = require('querystring');

module.exports = {
	name: 'refreshSpotifyToken',
	execute(spotifyAPI, spotify_config) {
		console.log('Refreshing Spotify\'s Access Token...');
		const data = querystring.stringify({
			'grant_type': 'refresh_token',
			'refresh_token': spotify_config.REFRESH_TOKEN,
		});
		const auth = 'Basic ' + new Buffer.from(`${spotify_config.CLIENT_ID}:${spotify_config.CLIENT_SECRET}`).toString('base64');
		const options = {
			hostname: 'accounts.spotify.com',
			port: 443,
			path: '/api/token',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': data.length,
				'Authorization': auth,
			},
		};

		const req = https.request(options, res => {
			let response = '';

			res.on('data', chunk => {
				response += chunk;
			});

			res.on('end', () => {
				if (res.statusCode == 200) {
					spotifyAPI.setAccessToken(JSON.parse(response).access_token);
					console.log('Successfully updated Spotify Access Token!');
					spotifyAPI.getMe().then(
						function(spotify_api_data) {
							console.log('Authenticated with Spotify Api as:', spotify_api_data.body.email);
						},
						function(error) {
							console.error('--- ERROR INITIALIZING SPOTIFY WEB API ---\n', error);
						},
					);
				}
				else {
					console.error(
						'--- SPOTIFY API RESPONSE ERROR ---\n',
						`HTTPS status code: ${res.statusCode}\n`,
						'Response body:\n' + response);
				}
			});

			res.on('error', error => {
				console.error(error);
			});
		});

		req.on('error', error => {
			console.error('--- HTTPS ERROR ---\n' + error);
		});

		req.write(data);
		req.end();
	},
};