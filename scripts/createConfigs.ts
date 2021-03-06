import fs from "fs";
import strings from "../src/strings";

console.log("Creating config folder...");
// create config dir if not exists
if (!fs.existsSync("./build/config")) {
	fs.mkdirSync("./build/config");
}

// save empty discord config
console.log("Creating empty discord config file...");
const defaultConfigDiscord = {
	"BOT_TOKEN": "",
	// 'DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER': '',
};
fs.writeFileSync(
	"./build/config/discord.json",
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
	"DEVICE_ID": "",
};
fs.writeFileSync("./build/config/spotify.json",
	JSON.stringify(defaultConfigSpotify, null, 4));
console.log(strings.spotify.configNotFound);

// make sure proper prefix-file exists
if (!fs.existsSync("./build/config/prefixes.json")) {
	fs.writeFileSync("./build/config/prefixes.json", "{}");
}
