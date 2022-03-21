# spoticord

*spoticord* is a discord bot that allows you to play your music directly from spotify to discord. You need to host your own instance of this bot because it ties directly to your Spotify account. You need Spotify Premium for this to work.

## Note
When pausing and resuming playback you may experience skipping and/or sped up audio.

## Installation

### Prerequisites
- Create a new application in [Discord's Developer Portal](https://discord.com/developers/applications)
- Create a new application in [Spotify's Developer Dashboard](https://developer.spotify.com/dashboard/applications)
  - Make sure to include https://example.com/callback as the redirect URL
- Install Rust and general dependencies for librespot compilation ([see their wiki](https://github.com/librespot-org/librespot/blob/master/COMPILING.md##setup))

### Installation
- Install node (v16) (e.g. using [nvm](https://github.com/nvm-sh/nvm))
- Download the latest release from this repo and extract it
- Install dependencies
  - Navigate into the directory you just downloaded from GitHub
  - Run `npm ci` (this can take a while)
  - (If an error occurs check if there is an build tool missing for compiling one of the dependencies)
- Provide your credentials
  - In your spoticord directory, run `npm run configs` to create emtpy config files.
  - `discord.json`: Fill in bot token from your application on the [developer portal](https://discord.com/developers/applications)
  - `spotify.json`: Fill in client id and secret from your application on the [developer dashboard](https://developer.spotify.com/dashboard/applications) and your username and password to be passed along to librespot, username can be found [here](https://www.spotify.com/de/account/overview/)
  - Run `npm run init` to start the Spotify authentification process and follow the link you receive in your terminal
    - Authenticate on the resulting webpage with your Spotify Account
		- You will be redirected to example.com. You need to copy the code after `code=` in your browser's address bar (it's veeeery long) and put it in your `spotify.json` after `AUTH_CODE`
    - (make sure you don't copy some ending after the auth code like `&state=` or similar)
	- Run `npm run init` again to generate the refresh token
    - you will see your account's email address in your terminal to verfiy that the login is working
  - The bot is now ready to be used!

## Usage

Start the bot with `node .`\
The default command prefix is `$` but you can also mention the bot instead of using the prefix.  
`$help` will send you an summary of all available commands.

## Disclaimer

This bot uses [librespot](https://github.com/librespot-org/librespot) to play music. And as they say:  
"Using this code to connect to Spotify's API is probably forbidden by them. Use at your own risk." Be aware!
