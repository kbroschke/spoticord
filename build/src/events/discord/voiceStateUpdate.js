"use strict";
module.exports = {
    name: 'voiceStateUpdate',
    execute(oldState, newState, client) {
        if (oldState.channel == null) {
            return;
        }
        else {
            let channelMembers;
            if (oldState.id == client.user.id) {
                if (newState.channel == null) {
                    return;
                }
                else {
                    channelMembers = newState.channel.members;
                }
            }
            // check oldState because if user leaves then newState.channel is null
            else {
                channelMembers = oldState.channel.members;
            }
            // when user leaves oldState does NOT include this user in channel.members
            // dont know why but it works now
            if (channelMembers.size == 1 && channelMembers.has(client.user.id)) {
                channelMembers.get(client.user.id).voice.connection.disconnect();
                // TODO pause Spotify
            }
        }
    },
};
