/**
 * Shared logging helpers for the Profile Copier frontend.
 * Prefixes every message with [ProfileCopier] and a timestamp so that
 * browser devtools filter the output to just this plugin.
 */

const TAG = "[ProfileCopier]";

export const logInfo = (msg: string, ...args: unknown[]) =>
  console.log(`${TAG} [INFO] ${msg}`, ...args);

export const logDebug = (msg: string, ...args: unknown[]) =>
  console.debug(`${TAG} [DEBUG] ${msg}`, ...args);

export const logWarn = (msg: string, ...args: unknown[]) =>
  console.warn(`${TAG} [WARN] ${msg}`, ...args);

export const logError = (msg: string, ...args: unknown[]) =>
  console.error(`${TAG} [ERROR] ${msg}`, ...args);
