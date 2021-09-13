/*
const discord_config = require("../../config/discord.json");

module.exports = {
	name: "lock",
	description: "Toggle avaiablity of Spotify controls to Discord.",
	execute(message, args, spotifyAPI) {
		// lock
		if (message.member.user.id == discord_config.DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER) {
			if (!locked) {
				discord_config.LOCKED = true;
				fs.writeFile("../config/discord_config.json", JSON.stringify(discord_config, null, 4), error => {
					if (error) {
						console.log("--- FS WRITE ERROR ---", error);
						message.channel.send("Sorry! There was an internal error!");
					}
					else {
						message.reply("I'm locked now.");
					}
				});
			}
			else {
				message.reply("I'm already locked.");
			}
		}

		//unlock
		if (message.member.user.id == spotifyOwnerDiscordID) {
			if (locked) {
				discord_config.LOCKED = false;
				fs.writeFile("../config/discord_config.json", JSON.stringify(discord_config, null, 4), error => {
					if (error) {
						console.log("--- FS WRITE ERROR ---", error);
						message.channel.send("Sorry! There was an internal error!");
					}
					else {
						message.reply("I'm not locked anymore.");
					}
				});
			}
			else {
				message.reply("I'm already unlocked.");
			}
		}
	},
};
*/
