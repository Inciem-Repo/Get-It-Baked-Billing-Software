import { useState } from "react";
import SettingsAside, {
  findComponentByTabId,
} from "../components/layout/SettingsAside";
import Header from "../components/layout/Header";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("kot");

  const renderActiveComponent = () => {
    const Component = findComponentByTabId(activeTab);

    if (!Component) {
      return (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-600">
            Component not found
          </h2>
          <p className="text-gray-500">
            No component found for ID: {activeTab}
          </p>
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              Available IDs:{" "}
              {settingssettingsMenuItems
                .flatMap((item) =>
                  item.children
                    ? [item.id, ...item.children.map((child) => child.id)]
                    : item.id
                )
                .join(", ")}
            </p>
          </div>
        </div>
      );
    }

    return <Component />;
  };

  return (
    <div className="flex flex-col w-full bg-gray-50">
      <div className="bg-white">
        <Header title={"Settings"} />
      </div>
      <div className=" overflow-auto bg-gray-50 flex">
        <SettingsAside activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-auto  p-2">{renderActiveComponent()}</main>
      </div>
    </div>
  );
}
