# spoticord

*spoticord* is a discord bot that allows you to play your music directly from spotify to discord. You need to host your own instance of this bot because it ties directly to your Spotify account. You need an Spotify Premium account for this to work.

## Disclaimer  

You should not consider this code as production-ready. Sometimes audio behaves really funky and laggy and most of the time the pacing is a little off. However, I hope I can resolve these issues in the near future.

## Installation

### Beforehand:
- Create a new application in [Discord's Developer Portal](https://discord.com/developers/applications)
- Create a new application in [Spotify's Developer Dashboard](https://developer.spotify.com/dashboard/applications)

### On the system running the bot:
- Install node (v14) (e.g. using [nvm](https://github.com/nvm-sh/nvm))
- Compile librespot
  - Follow the instructions from [their repo](https://github.com/librespot-org/librespot/blob/master/COMPILING.md) (we don't need any audio library dependencies since we're using pipe backend)
  - For compiling use: ```cargo build --release --no-default-features```
- Clone this repo
  - (e.g. with ```git clone https://github.com/kbroschke/spoticord.git```)
- Install dependencies
  - navigate into the directory you just downloaded from GitHub
  - run ```npm ci```
- Copy the librespot executable from `librespot/target/release/` into `spoticord/lib/`
- Fill in your details
  - In your spoticord directory, run `npm run configs` to create emtpy config files.
  - Follow the instructions you receive in your terminal
  - Run `npm run init` to start the Spotify authentification process and follow the instructions you receive in your Terminal

## Usage

Start bot with ```node .```\
Default command prefix is ```$``` but you can also mention the bot instead of using the prefix.  
```$help``` will send you an summary of all available commands.

## Disclaimer

This bot uses [librespot](https://github.com/librespot-org/librespotlibrespot) to play music. And as they say:  
"Using this code to connect to Spotify's API is probably forbidden by them. Use at your own risk." Be aware!
