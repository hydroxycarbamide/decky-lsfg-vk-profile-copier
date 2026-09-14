"""Logger setup for the Profile Copier plugin.

Follows the same pattern as decky-lsfg-vk: wraps decky.logger behind a
BaseService-style class so every component can accept or inject a logger.
"""

from typing import Optional

import decky


class BaseService:
    """Minimal base class providing structured logging (and path helpers)."""

    def __init__(self, logger=None):
        self.log = decky.logger if logger is None else logger
