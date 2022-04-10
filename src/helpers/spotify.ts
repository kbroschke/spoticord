import SpotifyWebApi from "spotify-web-api-node";
import { DEVICE_ID } from "../../config/spotify.json";

export type SearchType = Parameters<SpotifyWebApi["search"]>[1][number]
export type SearchResult =
	SpotifyApi.TrackObjectFull |
	SpotifyApi.ArtistObjectFull |
	SpotifyApi.AlbumObjectSimplified |
	SpotifyApi.PlaylistObjectSimplified |
	SpotifyApi.ShowObjectSimplified |
	SpotifyApi.EpisodeObjectSimplified;

/** Class representing to spotify resource (uri) */
export class SpotifyResource {
	type: SearchType;
	id: string;

	/**
	 * Create to resource
	 * @param {SearchType} type type of resource
	 * @param {string} id id of resource
	 */
	constructor(type: SearchType, id: string) {
		this.type = type;
		this.id = id;
	}

	/**
	 * Get spotify uri for this resource
	 * @return {string} spotify uri for this resource
	 */
	toString(): string {
		return `spotify:${this.type}:${this.id}`;
	}
}

/**
 * Checks if provided link is spotify uri or url
 * @param {string} link input string to analyze
 * @return {string | null} uri to spotify resource if input link is a valid spotify uri or url, null otherwise.
 */
export function parseLink(link: string): SpotifyResource | null {
	// regex parts
	const domain = "https?:\/\/open\.spotify\.com";
	const types = "track|artist|album|playlist|show|episode";
	const idPattern = "[a-zA-Z0-9]+";

	const url = `${domain}\/(?<urlType>${types})\/`;
	const uri = `spotify:(?<uriType>${types}):`;

	const exp = new RegExp(`(${url}|${uri})(?<id>${idPattern})(.*)`);

	const result = link.match(exp);

	if (!result) {
		return null;
	}
	const type = result.groups?.uriType || result.groups?.urlType;
	const id = result.groups?.id;

	if (!type || !id) {
		return null;
	}

	return new SpotifyResource(type as SearchType, id);
}

/**
 * Search Spotify with given query for given type of content
 * @param {string} query - Search for this query
 * @param {searchType} types - Search only these types of content
 * @param {SpotifyWebApi} spotifyAPI - SpotifyAPI instance to execute search
 * @return {Promise<SearchResult[]>} - Promise for search results if search completes successfully
 */
export async function searchSpotify(query: string, types: SearchType[],
	spotifyAPI: SpotifyWebApi): Promise<SearchResult[]> {
	return spotifyAPI.search(query, types, { limit: 5, market: "DE" }).then(
		function(data) {
			let items: SearchResult[] = [];

			if (types.length === 1) {
				if (data.body.tracks) {
					items = data.body.tracks.items;
				}
				else if (data.body.artists) {
					items = data.body.artists.items;
				}
				else if (data.body.albums) {
					items = data.body.albums.items;
				}
				else if (data.body.playlists) {
					items = data.body.playlists.items;
				}
				else if (data.body.shows) {
					items = data.body.shows.items;
				}
				else if (data.body.episodes) {
					items = data.body.episodes.items;
				}

				return items;
			}
			else {
				// merge all results together
				const trackItems = data.body.tracks?.items || [];
				const artistItems = data.body.artists?.items || [];
				const albumItems = data.body.albums?.items || [];
				const playlistItems = data.body.playlists?.items || [];
				const showItems = data.body.shows?.items || [];
				const episodeItems = data.body.episodes?.items || [];

				const totalResults = 5;
				const appendItem = (dataitems: typeof items) => {
					if (items.length < totalResults) {
						const item = dataitems.shift();
						if (item) {
							// add item to items, can't .push() because of types intersecting to 'never'
							items[items.length] = item;
						}
					}
				};

				let oldItemLength = 0;
				while (items.length < totalResults) {
					oldItemLength = items.length;

					appendItem(trackItems);
					appendItem(artistItems);
					appendItem(albumItems);
					appendItem(playlistItems);
					appendItem(showItems);
					appendItem(episodeItems);

					// break if no new items got added (no more search results)
					if (oldItemLength === items.length) break;
				}

				return items;
			}
		},
	);
}

/**
 * Starts spotify playback on librespot device.
 * @param {SpotifyResource | null} resource If given a resource, play this resource.
 * @param {boolean} transfer Transfer playback from other device to librespot device if true, just unpause librespot device if false. Ignored if given a resource.
 * @param {SpotifyWebApi} spotifyAPI to execute commands on.
 * @return {Promise} passthrough spotify api promise
 */
export function startPlayback(resource: SpotifyResource | null,
	transfer: boolean, spotifyAPI: SpotifyWebApi) {
	// start playing specified resource on librespot device
	if (resource) {
		let isContext: boolean;
		switch (resource.type) {
		case "track":
		case "episode":
			isContext = false;
			break;
		case "artist":
		case "album":
		case "playlist":
		case "show":
			isContext = true;
			break;
		}
		if (!isContext) {
			return spotifyAPI.play(
				{
					device_id: DEVICE_ID,
					uris: [resource.toString()],
				},
			);
		}
		else {
			return spotifyAPI.play(
				{
					device_id: DEVICE_ID,
					context_uri: resource.toString(),
				},
			);
		}
	}
	// else just start playback
	else if (transfer) {
		return spotifyAPI.transferMyPlayback([DEVICE_ID],
			{ play: true });
	}
	else {
		return spotifyAPI.play(
			{
				device_id: DEVICE_ID,
			},
		);
	}
}
