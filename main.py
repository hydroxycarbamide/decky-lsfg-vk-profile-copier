import os
import json
import tomllib
import decky

class Plugin:
    """Reads lsfg-vk config.toml and exposes profiles via @decky/api."""

    CONFIG_DIR = ".config/lsfg-vk"
    CONFIG_FILENAME = "conf.toml"

    async def _get_config_path(self) -> str:
        """Get the TOML config path.
        
        Priority:
        1. $LSFGVK_CONFIG environment variable
        2. DECKY_USER_HOME/.config/lsfg-vk/conf.toml
        """
        env_path = os.environ.get("LSFGVK_CONFIG")
        if env_path:
            return env_path
        
        # Use decky.DECKY_USER_HOME like decky-lsfg-vk does
        decky_user_home = getattr(decky, "DECKY_USER_HOME", None)
        if decky_user_home:
            from pathlib import Path
            return str(Path(decky_user_home) / self.CONFIG_DIR / self.CONFIG_FILENAME)
        
        # Fallback (shouldn't happen in Decky)
        return os.path.expanduser("~/.config/lsfg-vk/conf.toml")

    async def _read_profiles_from_toml(self, path: str) -> list[dict]:
        """Read profiles from a TOML file, return list of profile dicts."""
        try:
            with open(path, "rb") as f:
                data = tomllib.load(f)
        except FileNotFoundError:
            decky.logger.error(f"Config file not found: {path}")
            return []
        except Exception as e:
            decky.logger.error(f"Error reading config: {e}")
            return []

        profiles = data.get("profile", [])
        return profiles

    async def read_profiles(self) -> str:
        """Public API: read profiles and return JSON string."""
        path = await self._get_config_path()
        profiles = await self._read_profiles_from_toml(path)
        return json.dumps(profiles)

    async def get_profile_toml(self, index: int) -> str:
        """Get a specific profile section as TOML string (manual serialization)."""
        path = await self._get_config_path()
        try:
            with open(path, "rb") as f:
                data = tomllib.load(f)
            profiles = data.get("profile", [])
            if 0 <= index < len(profiles):
                return self._serialize_toml({"profile": profiles[index]})
        except Exception as e:
            decky.logger.error(f"Error reading profile {index}: {e}")
        return ""

    @staticmethod
    def _serialize_toml(data: dict) -> str:
        """Simple TOML serializer for profile sections."""
        output = ""
        for key, value in data.get("profile", {}).items():
            output += Plugin._format_value(key, value)
        return output

    @staticmethod
    def _format_value(key: str, value) -> str:
        """Format a TOML value."""
        if isinstance(value, bool):
            return f"{key} = {'true' if value else 'false'}\n"
        elif isinstance(value, (int, float)):
            return f"{key} = {value}\n"
        elif isinstance(value, str):
            escaped = value.replace('"', '\\"')
            return f'{key} = "{escaped}"\n'
        elif isinstance(value, list):
            items = []
            for v in value:
                if isinstance(v, bool):
                    items.append("true" if v else "false")
                elif isinstance(v, str):
                    escaped = v.replace('"', '\\"')
                    items.append(f'"{escaped}"')
                else:
                    items.append(str(v))
            return f"{key} = [{', '.join(items)}]\n"
        elif value is None:
            return f"{key} = \"\"\n"
        return f'{key} = "{value}"\n'

    async def _main(self):
        decky.logger.info("Profile Copier loaded")

    async def _unload(self):
        decky.logger.info("Profile Copier unloaded")
