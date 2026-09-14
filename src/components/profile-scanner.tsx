import { useState, useEffect, ChangeEvent } from "react";
import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  staticClasses,
  TextField,
} from "@decky/ui";
import { FaCopy, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { readProfilesBe } from "../backend";

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

function serializeToToml(section: ProfileSection): string {
  let output = "";
  for (const [key, value] of Object.entries(section)) {
    if (Array.isArray(value)) {
      const arrContent = value
        .map((v) => (typeof v === "string" ? `"${v}"` : v))
        .join(", ");
      output += `${key} = [${arrContent}]\n`;
    } else if (typeof value === "boolean") {
      output += `${key} = ${value}\n`;
    } else if (typeof value === "string") {
      output += `${key} = "${value}"\n`;
    } else if (value === null || value === undefined) {
      // skip nulls
    } else {
      output += `${key} = ${value}\n`;
    }
  }
  return output;
}

function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(resolve).catch(reject);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (e) {
        reject(e);
      }
      document.body.removeChild(textarea);
    }
  });
}

export function ProfileScanner() {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (profile: ProfileData) => {
    try {
      const tomlString = `[profile]\n${serializeToToml(profile.section)}`;
      await copyToClipboard(tomlString);
      setCopiedIndex(profile.index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy profile:", err);
      setError("Failed to copy to clipboard");
    }
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const profilesJson = await readProfilesBe();
        const parsed: ProfileSection[] = JSON.parse(profilesJson);
        const profileData: ProfileData[] = parsed.map(
          (section: ProfileSection, index: number) => ({
            index,
            name: section.name,
            section,
          })
        );
        setProfiles(profileData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch profiles:", err);
        setError("Failed to read config file. Make sure lsfg-vk is installed.");
        setLoading(false);
      }
    };
    fetchProfiles();
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
          <p>Copy individual profile configurations to clipboard for manual editing.</p>
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
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <FaCheck style={{ color: "#4caf50" }} /> Copied!
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <FaCopy /> Copy to Clipboard
                </span>
              )}
            </ButtonItem>
          </PanelSectionRow>
        ))}
      </PanelSection>

      {profiles.length > 0 && (
        <PanelSection>
          <PanelSectionRow>
            <div style={{ opacity: 0.5, fontSize: "14px" }}>
              Showing {filteredProfiles.length} of {profiles.length} profiles
              {search && ` matching "${search}"`}
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}
    </div>
  );
}
