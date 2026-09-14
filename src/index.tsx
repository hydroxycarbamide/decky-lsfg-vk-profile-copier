import { staticClasses } from "@decky/ui";
import { definePlugin } from "@decky/api";
import { FaCopy } from "react-icons/fa";
import { ProfileScanner } from "./components/profile-scanner";

function Content() {
  return <ProfileScanner />;
}

export default definePlugin(() => {
  return {
    name: "LSFG-VK-Profile-Copier",
    titleView: <div className={staticClasses.Title}>Profile Copier</div>,
    content: <Content />,
    icon: <FaCopy />,
    onDismount() {},
  };
});
