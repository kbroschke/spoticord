export default {
	spotify: {
		configNotFound: "The template was saved to config/spotify.json\n" +
		"Please fill in your client token and secret, as well as your username and password.\n" +
		"For more details please refer to the README.",
		noRefreshToken: "Refresh token and auth code is missing in config.\n" +
		"Here is your authentification link:",
		authError: "Something went wrong while sending the auth code to Spotify.\n" +
		"Please make sure to paste the whole code you got in the resulting redirect URL and make sure to leave out additional endings like '&state='.\n" +
		"If you need a new auth code, just remove the current one from the config file and start this script again.",
		loginError: "Something went wrong while logging in. Please make sure to closely follow the instructions in the README.",
		configNotFoundRunning: "A required field in Spotify config is missing. Please check the installation instructions.",
	},
	discord: {
		configNotFound: "The template was saved to config/discord.json\n" +
		"Please fill in your bot token. For more details please refer to the README.",
		configNotFoundRunning: "A required field in Discord config is missing. Please check the installation instructions.",
	},
	embeds: {
		titles: {
			ping: "Pong!",
		},
		descriptions: {
			text: "text",
		},
	},
};
