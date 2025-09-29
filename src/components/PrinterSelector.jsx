import React, { useEffect, useState } from "react";

export default function PrinterSelector({ open, onClose }) {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");

  useEffect(() => {
    if (open) {
      window.api.getPrinters().then(setPrinters);
      window.api.getSavedPrinter().then((saved) => {
        if (saved) setSelectedPrinter(saved);
      });
    }
  }, [open]);

  const handleSave = async () => {
    if (!selectedPrinter) return;
    await window.api.savePrinter(selectedPrinter);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white text-black rounded-lg shadow-lg p-6 w-[400px]">
        <h2 className="text-lg font-semibold mb-4">Choose Default Printer</h2>

        <select
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
          className="w-full border rounded p-2 mb-4"
        >
          <option value="">-- Select a printer --</option>
          {printers.map((p) => (
            <option key={p.name} value={p.name}>
              {p.displayName || p.name}
            </option>
          ))}
        </select>

        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 border rounded hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
