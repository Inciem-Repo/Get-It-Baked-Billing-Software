import { useEffect, useState } from "react";
import SettingsAside, {
  findComponentByTabId,
} from "../components/layout/SettingsAside";
import Header from "../components/layout/Header";
import { settingsMenuItems } from "../constance/menu";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("kot");

  useEffect(() => {
    const componentExists = !!findComponentByTabId(activeTab);
    if (!componentExists && settingsMenuItems.length > 0) {
      setActiveTab(settingsMenuItems[0].id);
    }
  }, [activeTab]);

  const renderActiveComponent = () => {
    const Component = findComponentByTabId(activeTab);
    if (!Component) return null;
    return <Component />;
  };

  return (
    <div className="flex flex-col w-full bg-gray-50">
      <div className="bg-white">
        <Header title={"Settings"} />
      </div>
      <div className=" overflow-auto bg-gray-50 flex">
        <SettingsAside activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-auto  p-2">
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
}
