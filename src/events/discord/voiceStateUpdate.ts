import { getVoiceConnection } from "@discordjs/voice";
import { Client, VoiceBasedChannel, VoiceState } from "discord.js";
import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../../config/spotify.json";

module.exports = {
	name: "voiceStateUpdate",
	execute(oldState: VoiceState, newState: VoiceState, client: Client,
		spotifyAPI: SpotifyWebApi) {
		if (!client.user) {
			console.error("Discord client is not logged in!");
			return;
		}

		let channel: VoiceBasedChannel;

		if (oldState.id == client.user.id) {
			// the bot created this event
			if (newState.channel == null) {
				// the bot left a voice channel
				pauseSpotify(spotifyAPI);
				return;
			}
			else {
				// the bot joined a voice channel
				channel = newState.channel;
				console.log("Bot joined a voice channel!");
			}
		}
		else {
			const userChannel = oldState.channel;
			const botChannel = oldState.guild.me?.voice.channel;
			if (userChannel && botChannel && userChannel.id === botChannel.id) {
				// user left our channel, oldState.channel.members are all users in old channel without the one that left
				channel = oldState.channel;
				console.log("Someone may left us alone.");
			}
			else {
				// user joined our channel or something entirely unrelated to us happened, ignore it
				return;
			}
		}

		// size === 1 means we are lonely in our channel
		if (channel.members.size === 1) {
			getVoiceConnection(channel.guildId)?.destroy();
		}
	},
};

// TODO move back into if statement
/**
 * pauses playback on a spotify API
 * @param {SpotifyWebApi} spotifyAPI
 */
function pauseSpotify(spotifyAPI: SpotifyWebApi) {
	spotifyAPI.pause({ "device_id": DEVICE_ID }).then(
		function() {
			console.log("Spotify playback paused after leaving voice channel.");
		},
		function(error) {
			console.error("ERROR: pause", error);
			// TODO catch nothings playing
		},
	);
}
