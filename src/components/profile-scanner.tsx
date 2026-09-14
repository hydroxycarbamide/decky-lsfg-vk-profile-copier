import { useState, useEffect, ChangeEvent } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  staticClasses,
  TextField,
} from "@decky/ui";
import { FaClipboard, FaCheck, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { readProfilesBe } from "../backend";
import { logInfo, logDebug, logWarn, logError } from "../logging";

interface ProfileSection {
  name?: string;
  active_in?: string[];
  [key: string]: any;
}

interface ProfileData {
  index: number;
  name?: string;
  section: ProfileSection;
}

function formatProfileDisplay(profile: ProfileData): string {
  if (profile.name) {
    let display = profile.name;
    if (profile.section.active_in && profile.section.active_in.length > 0) {
      display += ` (${profile.section.active_in.join(", ")})`;
    }
    return display;
  }
  const keys = Object.keys(profile.section).filter((k) => k !== "active_in");
  const preview = keys
    .slice(0, 3)
    .map((k) => `${k}=${profile.section[k]}`)
    .join(", ");
  return preview || `Profile #${profile.index}`;
}

function trimProfileDescription(profile: ProfileData): string {
  const keys = Object.keys(profile.section);
  const desc = keys
    .filter((k) => k !== "name" && k !== "active_in")
    .slice(0, 4)
    .map((k) => `${k}=${profile.section[k]}`)
    .join(", ");
  return desc.length > 80 ? desc.slice(0, 77) + "..." : desc;
}

/**
 * Copy text to clipboard using the proven Decky-Framegen method.
 * Uses execCommand first (works in gaming mode), with navigator.clipboard as fallback.
 */
const copyToClipboard = async (text: string, profileName?: string): Promise<boolean> => {
  const label = profileName ? ` for "${profileName}"` : "";
  logDebug(`Starting clipboard copy${label}`);
  try {
    // Create a hidden input element for text selection
    const tempInput = document.createElement("input");
    tempInput.value = text;
    tempInput.style.position = "absolute";
    tempInput.style.left = "-9999px";
    document.body.appendChild(tempInput);

    // Focus and select the text
    tempInput.focus();
    tempInput.select();

    // Try copying using execCommand first (most reliable in gaming mode)
    let copySuccess = false;
    try {
      if (document.execCommand("copy")) {
        logDebug(`execCommand("copy") succeeded${label}`);
        copySuccess = true;
      } else {
        logWarn(`execCommand("copy") returned false${label}, trying navigator.clipboard`);
      }
    } catch {
      // If execCommand fails, try navigator.clipboard as fallback
      try {
        await navigator.clipboard.writeText(text);
        logDebug(`navigator.clipboard.writeText succeeded${label}`);
        copySuccess = true;
      } catch (clipboardError) {
        logError(`Both copy methods failed${label}:`, clipboardError);
      }
    }

    // Clean up
    document.body.removeChild(tempInput);

    if (copySuccess) {
      logInfo(`Clipboard write complete${label}`);
    } else {
      logWarn(`Copy returned false${label} — clipboard may not be available`);
    }
    return copySuccess;
  } catch (error) {
    logError(`Exception during clipboard copy${label}:`, error);
    return false;
  }
};

export function ProfileScanner() {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (profile: ProfileData) => {
    try {
      const profileName = profile.name || `profile_${profile.index}`;
      logInfo(`Copying profile to clipboard: ${profileName}`);
      const copyString = `LSFGVK_PROFILE=${profileName}`;
      const success = await copyToClipboard(copyString, profileName);

      if (success) {
        logInfo(`Profile copied: ${profileName}`);
        setCopiedIndex(profile.index);
        setTimeout(() => {
          setCopiedIndex(null);
          logDebug("Reset copied state for profile", profile.index);
        }, 3000);
      } else {
        logError(`Copy failed for profile: ${profileName}`);
      }
    } catch (err) {
      logError(`Error copying profile:`, err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logError("Timeout fetching profiles after 5 seconds");
      setError("Timed out while loading profiles. Check Python backend.");
      setLoading(false);
      controller.abort();
    }, 5000);

    const fetchProfiles = async () => {
      try {
        logInfo("Fetching profiles from backend...");
        const profilesJson = await readProfilesBe();
        logDebug(`Raw JSON response (${profilesJson.length} chars)`);
        const parsed: ProfileSection[] = JSON.parse(profilesJson);
        logInfo(`Parsed ${parsed.length} profile(s) from JSON`);
        const profileData: ProfileData[] = parsed.map(
          (section: ProfileSection, index: number) => ({
            index,
            name: section.name,
            section,
          })
        );
        profileData.forEach((p) =>
          logDebug(
            `Profile ${p.index}: ${p.name || "unnamed"} (${Object.keys(p.section).length} keys)`
          )
        );
        logInfo(`Setting state with ${profileData.length} profile(s)`);
        setProfiles(profileData);
        setLoading(false);
        clearTimeout(timeoutId);
      } catch (err) {
        logError(`Failed to fetch profiles:`, err);
        setError(`Failed to read config: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };
    fetchProfiles();
    return () => clearTimeout(timeoutId);
  }, []);

  const filteredProfiles = profiles.filter((p) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const display = formatProfileDisplay(p).toLowerCase();
    return display.includes(term);
  });

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <div>
      <PanelSection>
        <PanelSectionRow>
          <div className={staticClasses.Title}>LSFG-VK Profiles</div>
          <p>
            Select a profile to copy its configuration to the clipboard.
          </p>
        </PanelSectionRow>

        {loading && (
          <PanelSectionRow>
            <div>Loading profiles...</div>
          </PanelSectionRow>
        )}

        {error && (
          <PanelSectionRow>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#d33",
              }}
            >
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          </PanelSectionRow>
        )}

        {!loading && !error && profiles.length === 0 && (
          <PanelSectionRow>
            <div>No profiles found in config file.</div>
          </PanelSectionRow>
        )}

        {!loading && profiles.length > 0 && (
          <PanelSectionRow>
            <TextField
              label="Search Profiles"
              value={search}
              onChange={handleSearchChange}
              description="Filter by name or game..."
            />
          </PanelSectionRow>
        )}

        {filteredProfiles.map((profile) => (
          <PanelSectionRow key={profile.index}>
            <ButtonItem
              layout="below"
              onClick={() => handleCopy(profile)}
              label={profile.name || `Profile #${profile.index}`}
              description={
                <div style={{ opacity: 0.7, marginTop: "4px" }}>
                  {trimProfileDescription(profile)}
                </div>
              }
            >
              {copiedIndex === profile.index ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#4CAF50",
                    fontWeight: "bold",
                  }}
                >
                  <FaCheck style={{ color: "#4CAF50" }} /> Copied to clipboard
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <FaClipboard /> Copy Profile
                </span>
              )}
            </ButtonItem>
          </PanelSectionRow>
        ))}
      </PanelSection>

      {profiles.length > 0 && (
        <PanelSection>
          <PanelSectionRow>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: 0.5,
                fontSize: "14px",
              }}
            >
              <FaInfoCircle />
              <span>
                Showing {filteredProfiles.length} of {profiles.length} profiles
                {search && ` matching "${search}"`}
              </span>
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}
    </div>
  );
}
