import { Message, MessageEmbed } from "discord.js";
import { readFileSync, writeFileSync } from "fs";

module.exports = {
	name: "prefix",
	description: "Sets new prefix. If no argument is given it shows the current prefix.",
	execute(message: Message, args: string[]) {
		// message-event already performs check that we're not a DM
		if (!message.guild) {return;}

		let prefixes;
		try {
			prefixes = JSON.parse(readFileSync("./config/prefixes.json").toString());
		}
		catch (error) {
			console.error("ERROR: readFileSync", error);
			const embed = new MessageEmbed({
				color: "#f0463a",
				description: "Internal error: Could not read prefix database.",
			});
			message.channel.send({ embeds: [embed] });
			return;
		}

		let prefix: string;
		if (message.guild.id in prefixes) {
			prefix = prefixes[message.guild.id];
		}
		else {
			prefix = "$";
		}

		if (args.length === 0) {
			const embed = new MessageEmbed({
				color: "#1DB954",
				description: `Current command prefix is \`${prefix}\``,
			});
			message.channel.send({ embeds: [embed] });
			return;
		}

		if (message.member && !message.member.permissions.has("ADMINISTRATOR")) {
			message.reply("sorry but you're not an administrator.");
			return;
		}

		prefix = args.join(" ");
		prefixes[message.guild.id] = prefix;
		try {
			writeFileSync("../../config/prefixes.json",
				JSON.stringify(prefixes, null, 4));
		}
		catch (error) {
			console.error("ERROR: writeFileSync", error);
			const embed = new MessageEmbed({
				color: "#f0463a",
				description: "Internal error: Could not write prefix database.",
			});
			message.channel.send({ embeds: [embed] });
		}

		const embed = new MessageEmbed({
			color: "#1DB954",
			description: `Command prefix is \`${prefix}\``,
		});
		message.channel.send({ embeds: [embed] });
	},
};
