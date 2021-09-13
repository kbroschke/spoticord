"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        if (client.user) {
            console.log("Discord bot is ready!");
            client.user.setActivity("@me help", { type: "LISTENING" });
        }
        else {
            console.error("Discord bot login error!");
        }
    },
};
