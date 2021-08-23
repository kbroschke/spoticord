import { Client } from "discord.js";

module.exports = {
	name: "ready",
	once: true,
	execute(client: Client) {
		if (client.user) {
			console.log("Discord bot is ready!");
			client.user.setActivity("@me help", { type: "LISTENING" });
		}
		else {
			console.error("Discord bot login error!");
		}
	},
};
