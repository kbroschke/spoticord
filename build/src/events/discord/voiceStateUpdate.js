"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spotify_json_1 = require("../../../config/spotify.json");
module.exports = {
    name: "voiceStateUpdate",
    execute(oldState, newState, client, spotifyAPI) {
        if (!client.user) {
            console.error("Discord client is not logged in!");
            return;
        }
        let channelMembers;
        // the bot created this event
        if (oldState.id == client.user.id) {
            // the bot left the voice channel
            if (newState.channel == null) {
                // TODO: handle error?
                spotifyAPI.pause({ device_id: spotify_json_1.DEVICE_ID });
                return;
            }
            // the bot joined a voice channel
            else {
                channelMembers = newState.channel.members;
            }
        }
        else {
            // no oldState means the user joined the channel and didn't leave it
            if (oldState.channel == null) {
                return;
            }
            else {
                channelMembers = oldState.channel.members;
            }
        }
        // size must be 1 because:
        // when user leaves, oldState does NOT include this user in channel.members
        const clientUser = channelMembers.get(client.user.id);
        if (clientUser && channelMembers.size === 1) {
            clientUser.voice.connection?.disconnect();
            // pause Spotify TODO: handle error?
            spotifyAPI.pause({ device_id: spotify_json_1.DEVICE_ID });
        }
    },
};
