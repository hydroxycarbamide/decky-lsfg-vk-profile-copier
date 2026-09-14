import os
import json
import tomllib
import time
import decky
from pathlib import Path


class Plugin():
    """Reads lsfg-vk config.toml and exposes profiles via @decky/api."""

    CONFIG_DIR = ".config/lsfg-vk"
    CONFIG_FILENAME = "conf.toml"

    def __init__(self, logger=None):
        self.log = decky.logger if logger is None else logger

    def _get_config_path(self) -> str:
        """Get the TOML config path."""
        env_path = os.environ.get("LSFGVK_CONFIG")
        if env_path:
            self.log.info(f"LSFGVK_CONFIG env var set: {env_path}")
            if not Path(env_path).exists():
                self.log.warning(f"Config file does not exist: {env_path}")
            return env_path

        decky_user_home = getattr(decky, "DECKY_USER_HOME", None)
        if decky_user_home:
            path = str(Path(decky_user_home) / self.CONFIG_DIR / self.CONFIG_FILENAME)
            self.log.debug(f"Resolved config via DECKY_USER_HOME: {path}")
            if not Path(path).exists():
                self.log.warning(f"Config file not found at resolved path: {path}")
            return path

        path = os.path.expanduser("~/.config/lsfg-vk/conf.toml")
        self.log.info(f"Fallback config path: {path}")
        return path

    def _read_profiles_from_toml(self, path: str) -> list[dict]:
        """Read profiles from a TOML file, return list of profile dicts."""
        try:
            file_size = Path(path).stat().st_size
            self.log.debug(f"Reading config file: {path} ({file_size} bytes)")
            with open(path, "rb") as f:
                data = tomllib.load(f)
        except FileNotFoundError:
            self.log.error(f"Config file not found: {path}")
            return []
        except PermissionError:
            self.log.error(f"Permission denied reading config: {path}")
            return []
        except tomllib.TOMLDecodeError as e:
            self.log.error(f"Invalid TOML syntax in {path}: {e}")
            return []
        except Exception as e:
            self.log.error(f"Error reading config at {path}: {e}")
            return []

        # Validate structure
        if not isinstance(data, dict):
            self.log.error(f"Config root is not a dictionary (got {type(data).__name__})")
            return []

        profiles = data.get("profile", [])
        if not isinstance(profiles, list):
            self.log.error(f"'profile' key is not a list (got {type(profiles).__name__})")
            return []

        # Log each profile's name for visibility
        for i, p in enumerate(profiles):
            name = p.get("name", "unnamed") if isinstance(p, dict) else str(p)
            self.log.debug(f"Profile {i}: name='{name}'")

        self.log.info(f"Loaded {len(profiles)} profile(s) from {path}")
        return profiles

    async def read_profiles(self) -> str:
        """Public API: read profiles and return JSON string."""
        start = time.monotonic()
        try:
            path = self._get_config_path()
            profiles = self._read_profiles_from_toml(path)
            elapsed = time.monotonic() - start
            self.log.info(f"read_profiles: {len(profiles)} profile(s) serialized in {elapsed:.3f}s")
            return json.dumps(profiles)
        except Exception as e:
            elapsed = time.monotonic() - start
            self.log.error(f"read_profiles failed after {elapsed:.3f}s: {e}")
            raise RuntimeError(str(e))

    async def get_profile_toml(self, index: int) -> str:
        """Get a specific profile section as TOML string (manual serialization)."""
        path = self._get_config_path()
        self.log.debug(f"get_profile_toml(index={index})")
        try:
            with open(path, "rb") as f:
                data = tomllib.load(f)
            profiles = data.get("profile", [])
            if 0 <= index < len(profiles):
                result = self._serialize_toml({"profile": profiles[index]})
                self.log.debug(f"get_profile_toml({index}): {len(result)} chars")
                return result
            else:
                self.log.warning(
                    f"Profile index {index} out of range (0-{len(profiles) - 1})"
                )
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
        self.log.debug(f"Runtime config dir: {self.CONFIG_DIR}/{self.CONFIG_FILENAME}")

    async def _unload(self):
        self.log.info("Profile Copier unloaded")
