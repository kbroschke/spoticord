"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const strings_1 = __importDefault(require("../src/strings"));
console.log("Creating config folder...");
// create config dir if not exists
if (!fs_1.default.existsSync("./config")) {
    fs_1.default.mkdirSync("./config");
}
// save empty discord config
console.log("Creating empty discord config file...");
const defaultConfigDiscord = {
    "BOT_TOKEN": "",
    // 'DISCORD_USER_ID_OF_SPOTIFY_ACCOUNT_OWNER': '',
};
fs_1.default.writeFileSync("./config/discord.json", JSON.stringify(defaultConfigDiscord, null, 4));
console.log(strings_1.default.discord.configNotFound);
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
fs_1.default.writeFileSync("./config/spotify.json", JSON.stringify(defaultConfigSpotify, null, 4));
console.log(strings_1.default.spotify.configNotFound);
// make sure proper prefix-file exists
if (!fs_1.default.existsSync("./config/prefixes.json")) {
    fs_1.default.writeFileSync("./config/prefixes.json", "{}");
}
