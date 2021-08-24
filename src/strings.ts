export = {
	name: "strings",
	spotify: {
		configNotFound: "The template was saved to ../config/spotify.json\n" +
		"Please read the following instructions carefully.\n\n" +
		"Please fill in everything except the refresh token and auth code for now.\n" +
		"Your Client ID & Secret can be found at https://developer.spotify.com/dashboard/applications.\n" +
		"If you never created an Application through Spotify's Dashboard before you should search the internet for a guide on how to do so but it's actually not really hard BUT(!)\n" +
		"you MUST add 'https://example.com/callback' as an redirect URL in your application!\n\n" +
		"Your username (that's not strictly the name you see in Spotify, sometimes it's just random characters) can be found at:\n" +
		"https://www.spotify.com/de/account/overview/\n" +
		"The password is just passed through to Librespot for Authentication. If you do not trust me (and you shouldn't) you can find the code of this bot here:\n" +
		"https://github.com/kbroschke/spoticord\n",
		noRefreshToken: "Refresh token and auth code is missing in config.\n" +
		"After this text there will be an weblink.\n" +
		"You need to copy this into a browser and authenticate on the resulting webpage with your Spotify Account.\n" +
		"You will be redirected to example.com. You need to copy the code after 'code=' in your browser's address bar (yes, it's veeeery long). And make sure you don't copy some ending after the auth code like '&state='!\n" +
		"You need to paste this code in the spotify.json file behind 'AUTH_CODE'.\n" +
		"Then start the init script again.",
		authError: "Something went wrong while sending the auth code to Spotify.\n" +
		"Please make sure to paste the whole code you got in the resulting redirect URL and make sure to leave out additional endings like '&state='.\n" +
		"If you need a new auth code, just remove the current one from the config file and start the init script again.",
		configNotFoundRunning: "A required field in Spotify config is missing. Please check the installation instructions.",
	},
	discord: {
		configNotFound: "The template was saved to ../config/discord.json\n" +
		"If your need a new template run 'npm run configs'." +
		"Please fill in your bot token for the Discord API. It's required for the bot to work.\n" +
		"It can be found at https://discord.com/developers/applications (under Bot > Token).\n",
		// 'The DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER can be left as an empty String if the feature for locking the bot is not needed.\n' +
		configNotFoundRunning: "A required field in Discord config is missing. Please check the installation instructions.",
	},
};
