const fs = require("fs");
const strings = require("./strings");

console.log("Creating config folder...");
// create config dir if not exists
if (!fs.existsSync("./config")) {
	fs.mkdirSync("./config");
}

// save empty discord config
console.log("Creating empty discord config file...");
const defaultConfigDiscord = {
	"BOT_TOKEN": "",
	// 'DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER': '',
};
fs.writeFileSync(
	"./config/discord.json",
	JSON.stringify(defaultConfigDiscord, null, 4),
);
console.log(strings.discord.configNotFound);

// save empty spotify config
console.log("Creating empty spotify config file...");
const defaultConfigSpotify = {
	"CLIENT_ID": "",
	"CLIENT_SECRET": "",
	"REFRESH_TOKEN": "",
	"AUTH_CODE": "",
	"USERNAME": "",
	"PASSWORD": "",
	"LIBRESPOT_PATH": "",
};
fs.writeFileSync("./config/spotify.json",
	JSON.stringify(defaultConfigSpotify, null, 4));
console.log(strings.spotify.configNotFound);

// make sure proper prefix-file exists
if (!fs.existsSync("./config/prefixes.json")) {
	fs.writeFileSync("./config/prefixes.json", "{}");
}
