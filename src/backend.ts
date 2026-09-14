import { callable } from "@decky/api";

export const readProfilesBe = callable<[], string>("read_profiles");
