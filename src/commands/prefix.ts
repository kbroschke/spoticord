import { Message, MessageEmbed } from "discord.js";
import { readFileSync, writeFileSync } from "fs";

const embed = new MessageEmbed().setColor("#1DB954");

module.exports = {
	name: "prefix",
	description: "Sets new prefix. If no argument is given it shows the current prefix.",
	execute(message: Message, args: string[]) {
		// message-event already performs check that we're not a DM
		if (!message.guild) {return;}

		let prefixes;
		try {
			prefixes = JSON.parse(
				readFileSync("../../config/prefixes.json").toString());
		}
		catch (error) {
			console.error(error);
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
			message.channel.send(embed.setDescription(
				`Current command prefix is \`${prefix}\``));
			return;
		}
		if (message.member && !message.member.hasPermission("ADMINISTRATOR")) {
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
			console.error("--- FS WRITE ERROR ---", error);
			message.channel.send("Sorry! There was an internal error!");
		}

		message.channel.send(embed.setDescription(
			`Command prefix set to \`${prefix}\``));
	},
};
