"use strict";
module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log('Discord bot is ready!');
        client.user.setActivity('@me help', { type: 'LISTENING' });
    },
};
