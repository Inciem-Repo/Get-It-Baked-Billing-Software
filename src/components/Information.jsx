import { X, Info } from "lucide-react";
import React from "react";
import { infoPoints } from "../constance/info";

function Information({ setShowInfoModal }) {
  return (
    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <h3 className="text-lg font-semibold text-blue-800">Information</h3>
        </div>
        <button
          onClick={() => setShowInfoModal && setShowInfoModal(false)}
          className="text-blue-400 hover:text-blue-600 hover:cursor-pointer transition-colors "
        >
          <X size={20} />
        </button>
      </div>
      <div className="space-y-3 mb-2">
        <ul>
          {infoPoints.map((point) => (
            <div className="flex flex-col gap-2">
              <li key={point.id} className="my-1">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-gray-700 font-medium">
                    {point.text}
                  </span>
                  <kbd className="bg-red-100 text-red-700 px-3 py-1 rounded-md font-bold border border-red-200 shadow-sm">
                    {point.key}
                  </kbd>
                  <span className="text-gray-600">{point.description}</span>
                </div>
              </li>
            </div>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Information;
