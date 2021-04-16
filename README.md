# spoticord

*spoticord* is a discord bot that allows you to play your music directly from spotify to discord. You need to host your own instance of this bot because it ties directly to your Spotify account. You need an Spotify Premium account for this to work.

## Disclaimer  

This code doesnt work, yet!

## Installation

__TBD/WIP__
but here's a rough outline:
- install node (v14)
  - I recommend using nvm 
- install librespot
  - download a precompiled version or
  - clone [their repo](https://github.com/librespot-org/librespot)
  - build with ```cargo build --release --no-default-features```
- download this bot
- install dependencies: ```npm ci```
- create a new application (and bot) in [Discord's Developer Portal](https://discord.com/developers/applications)
- create a new app in [Spotify's Developer Dashboard](https://developer.spotify.com/dashboard/applications)
- create run-script with Spotify credentials for librespot (TODO: create template)
- create config-file with Discord's and Spotify's API tokens (TODO: create template)
- start bot with ```node .```

## Usage

Default command prefix is ```$``` but you can also mention the bot instead of using the prefix.  
```$help``` will send you an summary of all available commands.

## Disclaimer

This bot uses [librespot](https://github.com/librespot-org/librespotlibrespot) to play music. And as they say:  
"Using this code to connect to Spotify's API is probably forbidden by them. Use at your own risk." Be aware!
