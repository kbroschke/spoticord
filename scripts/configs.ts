import { existsSync, mkdirSync, writeFileSync } from "fs";
import strings from "../src/strings";

console.log("Creating config folder...");
// create config dir if not exists
if (!existsSync("./config")) {
	mkdirSync("./config");
}

// save empty discord config
console.log("Creating empty discord config file...");
const defaultConfigDiscord = {
	"BOT_TOKEN": "",
};
writeFileSync(
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
	"DEVICE_ID": "",
};
writeFileSync("./config/spotify.json",
	JSON.stringify(defaultConfigSpotify, null, 4));
console.log(strings.spotify.configNotFound);

// make sure proper empty prefix-file exists
if (!existsSync("./config/prefixes.json")) {
	writeFileSync("./config/prefixes.json", "{}");
}
