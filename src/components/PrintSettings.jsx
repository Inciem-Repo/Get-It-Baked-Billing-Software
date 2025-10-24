import { Printer } from "lucide-react";
import { useEffect, useState } from "react";

export default function PrintSettings() {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");

  useEffect(() => {
    window.api.getPrinters().then(setPrinters);
    window.api.getSavedPrinter().then((saved) => {
      if (saved) setSelectedPrinter(saved);
    });
  }, []);

  const handleSave = async () => {
    if (!selectedPrinter) return;
    await window.api.savePrinter(selectedPrinter);
  };

  return (
    <div className="fixed">
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
      </div>
    </div>
  );
}
