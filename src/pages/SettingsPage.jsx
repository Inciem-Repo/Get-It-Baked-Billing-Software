import { useState, useEffect } from "react";
import SettingsAside, {
  findComponentByTabId,
} from "../components/layout/SettingsAside";
import Header from "../components/layout/Header";
import { settingsMenuItems } from "../constance/menu";

export default function SettingsPage() {
  // Default to the first available tab automatically
  const [activeTab, setActiveTab] = useState(settingsMenuItems[0]?.id || "");

  // Update activeTab if current one no longer exists (e.g. item removed)
  useEffect(() => {
    const exists = settingsMenuItems.some(
      (item) =>
        item.id === activeTab ||
        item.children?.some((child) => child.id === activeTab)
    );
    if (!exists && settingsMenuItems.length > 0) {
      setActiveTab(settingsMenuItems[0].id);
    }
  }, [activeTab]);

  const renderActiveComponent = () => {
    const Component = findComponentByTabId(activeTab);
    return Component ? <Component /> : null;
  };

  return (
    <div className="flex flex-col w-full bg-gray-50">
      <div className="bg-white">
        <Header title={"Settings"} />
      </div>
      <div className="overflow-auto bg-gray-50 flex">
        <SettingsAside activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-auto p-2">
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
}
