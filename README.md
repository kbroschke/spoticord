# spoticord

*spoticord* is a discord bot that allows you to play your music directly from spotify to discord. You need to host your own instance of this bot because it ties directly to your Spotify account. You need Spotify Premium for this to work.

## Note
When pausing and resuming playback you may experience skipping and/or sped up audio.

## Installation

### Prerequisites
- Create a new application in [Discord's Developer Portal](https://discord.com/developers/applications)
- Create a new application in [Spotify's Developer Dashboard](https://developer.spotify.com/dashboard/applications)
- Install Rust and general dependencies for librespot compilation ([see their wiki](https://github.com/librespot-org/librespot/blob/master/COMPILING.md##setup))

### Installation
- Install node (v14) (e.g. using [nvm](https://github.com/nvm-sh/nvm))
- Download the latest release from this repo and extract it
- Install dependencies
  - Navigate into the directory you just downloaded from GitHub
  - Run `npm ci`
  - (If an error occurs check if there is an build tool missing for compiling one of the dependencies)
- Provide your credentials
  - In your spoticord directory, run `npm run configs` to create emtpy config files.
  - TODO: migrate instructions from terminal output to github
  - Run `npm run init` to start the Spotify authentification process and follow the instructions you receive in your terminal

## Usage

Start the bot with `node .`\
The default command prefix is `$` but you can also mention the bot instead of using the prefix.  
`$help` will send you an summary of all available commands.

## Disclaimer

This bot uses [librespot](https://github.com/librespot-org/librespot) to play music. And as they say:  
"Using this code to connect to Spotify's API is probably forbidden by them. Use at your own risk." Be aware!
