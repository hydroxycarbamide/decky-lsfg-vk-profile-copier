import os
import json
import tomllib
import decky
from pathlib import Path

from .logger import BaseService


class Plugin(BaseService):
    """Reads lsfg-vk config.toml and exposes profiles via @decky/api."""

    CONFIG_DIR = ".config/lsfg-vk"
    CONFIG_FILENAME = "conf.toml"

    def __init__(self, logger=None):
        super().__init__(logger)

    def _get_config_path(self) -> str:
        """Get the TOML config path."""
        env_path = os.environ.get("LSFGVK_CONFIG")
        if env_path:
            self.log.info(f"Using config from LSFGVK_CONFIG: {env_path}")
            return env_path

        decky_user_home = getattr(decky, "DECKY_USER_HOME", None)
        if decky_user_home:
            return str(Path(decky_user_home) / self.CONFIG_DIR / self.CONFIG_FILENAME)

        path = os.path.expanduser("~/.config/lsfg-vk/conf.toml")
        self.log.info(f"Using default config path: {path}")
        return path

    def _read_profiles_from_toml(self, path: str) -> list[dict]:
        """Read profiles from a TOML file, return list of profile dicts."""
        try:
            with open(path, "rb") as f:
                data = tomllib.load(f)
        except FileNotFoundError:
            self.log.error(f"Config file not found: {path}")
            return []
        except Exception as e:
            self.log.error(f"Error reading config at {path}: {e}")
            return []

        profiles = data.get("profile", [])
        self.log.info(f"Read {len(profiles)} profiles from config")
        return profiles

    async def read_profiles(self) -> str:
        """Public API: read profiles and return JSON string."""
        try:
            path = self._get_config_path()
            profiles = self._read_profiles_from_toml(path)
            self.log.debug(f"Serializing {len(profiles)} profiles to JSON")
            return json.dumps(profiles)
        except Exception as e:
            self.log.error(f"read_profiles failed: {e}")
            raise RuntimeError(str(e))

    async def get_profile_toml(self, index: int) -> str:
        """Get a specific profile section as TOML string (manual serialization)."""
        path = await self._get_config_path()
        self.log.debug(f"get_profile_toml(index={index})")
        try:
            with open(path, "rb") as f:
                data = tomllib.load(f)
            profiles = data.get("profile", [])
            if 0 <= index < len(profiles):
                return self._serialize_toml({"profile": profiles[index]})
            else:
                self.log.warning(f"Profile index {index} out of range (0-{len(profiles)-1})")
        except Exception as e:
            self.log.error(f"Error reading profile {index} from {path}: {e}")
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
            return f'{key} = ""\n'
        return f'{key} = "{value}"\n'

    async def _main(self):
        self.log.info("Profile Copier loaded")

    async def _unload(self):
        self.log.info("Profile Copier unloaded")
