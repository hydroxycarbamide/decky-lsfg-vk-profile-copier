# decky-lsfg-vk-profile-copier

A simple [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) plugin for the [Steam Deck](https://www.steamdeck.com/) that lets you copy LSFG-VK profile configurations to clipboard.

## Features

- Scans your LSFG-VK config file (`~/.config/lsfg-vk/conf.toml`) and lists all profiles
- One-click copy of any profile's TOML config to clipboard
- Search/filter profiles by name or game target
- Respects `$LSFGVK_CONFIG` environment variable for custom config paths

## Usage

Install via Decky Loader from the plugin store, or install manually from the built zip.

## Config Path Resolution

The plugin resolves the config file in this order:

1. `$LSFGVK_CONFIG` environment variable (if set)
2. `DECKY_USER_HOME/.config/lsfg-vk/conf.toml` (e.g. `/home/deck/.config/lsfg-vk/conf.toml` on SteamOS)
3. `~/.config/lsfg-vk/conf.toml` fallback

This matches how the main `decky-lsfg-vk` plugin resolves its config path.

## Development

```bash
pnpm i
pnpm run build
pnpm run watch
```

## License

MIT
