import { joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { spotifyGreen } from "../colors";
import { Guild, GuildMember, InteractionReplyOptions, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import emojiCharacters from "../emojiCharacters";
import { SearchResult } from "./spotify";

/**
 * Generate interaction reply for given search results
 * @param {string} query The search query which gave the results.
 * @param {SearchResult[]} items The search results from spotify.
 * @return {InteractionReplyOptions | null} message with search results to reply with.
 */
export function generateSearchResults(query: string, items: SearchResult[]):
	InteractionReplyOptions & { fetchReply: true } | null {
	if (items.length === 0) {
		return null;
	}
	else {
		// turn spotify search response into a readable list
		const searchEmbed = new MessageEmbed({
			// TODO search query type in title?
			title: `Search results for \`${query}\``,
			color: spotifyGreen,
		});
		const row = new MessageActionRow();

		items.forEach((element, index) => {
			let indexEmote: string;
			// cant condense into one statement because of type checking
			switch (index + 1) {
			case 1:
				indexEmote = emojiCharacters[1];
				break;
			case 2:
				indexEmote = emojiCharacters[2];
				break;
			case 3:
				indexEmote = emojiCharacters[3];
				break;
			case 4:
				indexEmote = emojiCharacters[4];
				break;
			case 5:
				indexEmote = emojiCharacters[5];
				break;
			default:
				indexEmote = emojiCharacters.warning;
				break;
			}

			row.addComponents(
				new MessageButton()
					.setCustomId(index.toString())
					.setStyle("PRIMARY")
					.setEmoji(indexEmote),
			);

			let creator: string;
			switch (element.type) {
			case "track":
			case "album":
				creator = `by ${element.artists[0].name}`;
				break;
			case "artist":
				const followers = element.followers.total;
				creator = `${followers} follower`;
				if (followers !== 1) {
					creator += "s";
				}
				break;
			case "playlist":
				creator = `by ${element.owner.display_name}`;
				break;
			case "show":
				creator = `by ${element.publisher}`;
				break;
			case "episode":
				// TODO new api request for show object
				creator = "by someone (WIP)";
				break;
			}

			searchEmbed.addField(
				`${indexEmote} ${element.name} \`${element.type}\``,
				creator,
			);
		});

		return {
			embeds: [searchEmbed],
			components: [row],
			fetchReply: true,
		};
	}
};

/**
 * Join voice channel of guild member
 * @param {GuildMember} member join channel of this member
 * @param {Guild} guild guild in which this is happending
 * @return {VoiceConnection | undefined}
 */
export function joinMember(member: GuildMember, guild: Guild):
	VoiceConnection | undefined {
	if (member.voice.channelId) {
		if (member.voice.channelId !== guild.me?.voice.channelId) {
			return joinVoiceChannel({
				channelId: member.voice.channelId,
				guildId: guild.id,
				adapterCreator: guild.voiceAdapterCreator,
			});
		}
	}
}
