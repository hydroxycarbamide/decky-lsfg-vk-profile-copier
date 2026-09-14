# decky-lsfg-vk-profile-copier

A simple [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) plugin for the [Steam Deck](https://www.steamdeck.com/) that lets you copy LSFG-VK profile configurations to clipboard.

## Features

- Scans your LSFG-VK config file (`~/.config/lsfg-vk/conf.toml`) and lists all profiles
- One-click copy of any profile's TOML config to clipboard
- Search/filter profiles by name or game target
- Respects `$LSFGVK_CONFIG` environment variable for custom config paths

## Install

1. **Download the plugin** from the [releases tab](https://github.com/hydroxycarbamide/decky-lsfg-vk-profile-copier/releases)
   - Download the "decky-lsfg-vk-profile-copier" file to your Steam Deck
2. **Install manually through Decky**:
   - In Game Mode, go to the settings cog in the top right of the Decky Loader tab
   - Enable "Developer Mode"
   - Go to "Developer" tab and select "Install Plugin from Zip"
   - Select the downloaded "decky-lsfg-vk-profile-copier" file

## Building

Building the frontend:
```bash
pnpm i
pnpm run build
```

Packaging the plugin:

```bash
./vscode/setup.sh
./vscode/build.sh
```

## Config Path Resolution

The plugin resolves the config file in this order:

1. `$LSFGVK_CONFIG` environment variable (if set)
2. `DECKY_USER_HOME/.config/lsfg-vk/conf.toml` (e.g. `/home/deck/.config/lsfg-vk/conf.toml` on SteamOS)
3. `~/.config/lsfg-vk/conf.toml` fallback

This matches how the main `decky-lsfg-vk` plugin resolves its config path.
