"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
const querystring_1 = __importDefault(require("querystring"));
const spotify_json_1 = __importDefault(require("../config/spotify.json"));
exports.default = {
    name: "refreshSpotifyToken",
    execute: async () => {
        console.log("Refreshing Spotify's Access Token...");
        const data = querystring_1.default.stringify({
            "grant_type": "refresh_token",
            "refresh_token": spotify_json_1.default.REFRESH_TOKEN,
        });
        const auth = "Basic " + Buffer.from(`${spotify_json_1.default.CLIENT_ID}:${spotify_json_1.default.CLIENT_SECRET}`).toString("base64");
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
            const req = https_1.default.request(options, (res) => {
                let response = "";
                res.on("data", (chunk) => {
                    response += chunk;
                });
                res.on("end", () => {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(response).access_token);
                    }
                    else {
                        console.error("--- SPOTIFY API RESPONSE ERROR ---\n", `HTTPS status code: ${res.statusCode}\n`, "Response body:\n" + response);
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
