import { callable } from "@decky/api";

export const readProfilesBe = callable<[], string>("read_profiles");
export const getProfileTomlBe = callable<[number], string>("get_profile_toml");
