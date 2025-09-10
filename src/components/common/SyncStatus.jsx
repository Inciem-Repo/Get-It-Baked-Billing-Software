import { useEffect, useState } from "react";
import { syncDetails } from "../../service/billingService";

function SyncStatus() {
  const [status, setStatus] = useState({ status: "idle", message: "Idle" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.api.onSyncStatus((data) => {
      setStatus(data);
      setLoading(false);
      console.log("Sync event:", data);
    });

    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncDetails();
      } else {
        setStatus({ status: "offline", message: "Not connected" });
      }
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const bgColor =
    status?.status === "loading"
      ? "#2563eb"
      : status?.status === "success"
      ? "#16a34a"
      : status?.status === "error"
      ? "#f97316"
      : status?.status === "offline"
      ? "#dc2626"
      : "#64748b";

  return (
    <div className=" flex gap-2">
      <div
        className="p-3 text-sm transition-all text-white font-bold"
        style={{ color: bgColor }}
      >
        {status?.message || "Idle"}
      </div>
    </div>
  );
}

export default SyncStatus;
