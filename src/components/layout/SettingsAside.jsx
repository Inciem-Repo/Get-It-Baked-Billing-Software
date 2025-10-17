import { Settings } from "lucide-react";
import { settingsMenuItems } from "../../constance/menu";

// Helper function to find component by tab ID
export const findComponentByTabId = (tabId) => {
  const findInItems = (items) => {
    for (const item of items) {
      if (item.id === tabId && item.component) {
        return item.component;
      }
      if (item.children) {
        const found = findInItems(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  return findInItems(settingsMenuItems);
};

export default function SettingsAside({ activeTab, setActiveTab }) {
  const rendersettingsMenuItems = (items) => {
    return items.map((item) => (
      <li key={item.id}>
        {item.children ? (
          <div className="mb-2">
            <div className="px-4 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
              {item.label}
            </div>
            <ul className="ml-4 space-y-1">
              {rendersettingsMenuItems(item.children)}
            </ul>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeTab === item.id
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </button>
        )}
      </li>
    ));
  };

  return (
    <aside className="w-64 min-h-[calc(100vh-75px)] overflow-auto bg-white border-r border-gray-200 shadow-sm">
      <nav>
        <ul className="space-y-1 ">
          {rendersettingsMenuItems(settingsMenuItems)}
        </ul>
      </nav>
    </aside>
  );
}
