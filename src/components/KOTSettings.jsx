import { useState, useEffect, useRef } from "react";
import {
  Save,
  Play,
  Volume2,
  Bell,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";
import { getKotConfig, updateKotConfig } from "../service/KOTService";
import toast from "react-hot-toast";

const SOUND_OPTIONS = [
  { value: "alarm_1.mp3", label: "Notification Bell" },
  { value: "alarm_2.mp3", label: "Alert Sound" },
  { value: "alarm_3.mp3", label: "Chime" },
  { value: "alarm_2.mp3", label: "Ding" },
  { value: "alarm_1.mp3", label: "Beep" },
];

export default function KOTSettings() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playingPreview, setPlayingPreview] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deviceIP, setDeviceIP] = useState("");
  const [copied, setCopied] = useState(false);
  const audioRef = useRef(null);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    id: null,
    kot_monitor_url: "",
    reminder_time_minutes: 5,
    sound_file: "notification.mp3",
    enable_sound: true,
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Function to get device IP address
  const getDeviceIP = async () => {
    try {
      return new Promise((resolve) => {
        const RTCPeerConnection =
          window.RTCPeerConnection ||
          window.mozRTCPeerConnection ||
          window.webkitRTCPeerConnection;

        if (!RTCPeerConnection) {
          resolve("192.168.1.1"); // Fallback IP
          return;
        }

        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel("");
        pc.createOffer()
          .then(pc.setLocalDescription.bind(pc))
          .catch(() => {
            resolve("192.168.1.1"); // Fallback IP
          });

        pc.onicecandidate = (ice) => {
          if (!ice || !ice.candidate || !ice.candidate.candidate) {
            resolve("192.168.1.1");
            return;
          }

          const myIP =
            /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(
              ice.candidate.candidate
            )[1];
          resolve(myIP);
          pc.close();
        };
      });
    } catch (error) {
      console.error("Error getting IP:", error);
      return "N/A";
    }
  };

  useEffect(() => {
    const fetchDefaultConfig = async () => {
      try {
        setLoading(true);
        const ip = await getDeviceIP();
        setDeviceIP(ip);

        const defaultKotUrl = `http://${ip}:3000/kot`;

        const result = await getKotConfig();

        if (result.success && result.data) {
          const config = result.data;
          const soundFile = config.sound_file.includes(".mp3")
            ? config.sound_file
            : `${config.sound_file}.mp3`;
          const enableSound = config.enable_sound === 1;

          setFormData({
            id: config.id,
            kot_monitor_url: defaultKotUrl,
            reminder_time_minutes: config.reminder_time_minutes || 5,
            sound_file: soundFile || "alarm_1.mp3",
            enable_sound: enableSound,
          });
        } else {
          setFormData({
            id: 1,
            kot_monitor_url: defaultKotUrl,
            reminder_time_minutes: 5,
            sound_file: "alarm_1.mp3",
            enable_sound: true,
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        const ip = await getDeviceIP();
        setDeviceIP(ip);
        const defaultKotUrl = `http://${ip}:3000/kot`;

        setFormData({
          kot_monitor_url: defaultKotUrl,
          reminder_time_minutes: 5,
          sound_file: "alarm_1.mp3",
          enable_sound: true,
        });

        alert(
          "Error loading settings from server, using default configuration"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log("Saving KOT Settings:", {
        ...formData,
        audioFileName: formData.sound_file,
        deviceIP: deviceIP,
      });
      const result = await updateKotConfig({
        ...formData,
        audioFileName: formData.sound_file,
        deviceIP: deviceIP,
      });
      if (result.success) {
        toast.success("Settings saved successfully!");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Can't saving settings");
    } finally {
      setSaving(false);
    }
  };

  const playPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setPlayingPreview(true);
    const audio = new Audio(`/audio/${formData.sound_file}`);
    audioRef.current = audio;

    audio.play().catch((err) => {
      console.error("Error playing audio:", err);
      alert(
        "Could not play audio preview. Make sure the audio file exists in public/audio folder."
      );
      setPlayingPreview(false);
    });

    audio.onended = () => {
      setPlayingPreview(false);
    };

    audio.onerror = () => {
      setPlayingPreview(false);
      alert(`Audio file not found: /audio/${formData.sound_file}`);
    };
  };

  const getSelectedSoundLabel = () => {
    const selected = SOUND_OPTIONS.find(
      (option) => option.value === formData.sound_file
    );
    return selected ? selected.label : "Select a sound";
  };

  const handleSoundSelect = (option) => {
    console.log("Selected sound:", option);
    setFormData({ ...formData, sound_file: option.value });
    setDropdownOpen(false);
    setTimeout(() => {
      playPreview();
    }, 300);
  };

  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Function to update KOT URL when IP changes manually
  const updateKotUrlWithIP = (newIP) => {
    setDeviceIP(newIP);
    setFormData({
      ...formData,
      kot_monitor_url: `http://${newIP}:3000/kot`,
    });
  };

  // Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formData.kot_monitor_url);
      setCopied(true);
      toast.success("URL copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast.error("Failed to copy URL");
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8 flex justify-center items-center h-40">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">
                Loading settings and detecting IP...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white min-h-[calc(100vh-90px)] shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-800 text-sm">
                  Device Information
                </h3>
                <p className="text-blue-600 text-sm mt-1">
                  Detected IP:{" "}
                  <span className="font-mono font-bold">{deviceIP}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const newIP = await getDeviceIP();
                  setDeviceIP(newIP);
                  updateKotUrlWithIP(newIP);
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                Refresh IP
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              KOT Monitor URL
            </label>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={formData.kot_monitor_url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kot_monitor_url: e.target.value,
                    })
                  }
                  placeholder="http://192.168.1.1:3000/kot"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Automatically generated from device IP:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  http://{deviceIP}:3000/kot
                </code>
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              Reminder Time
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="60"
                value={formData.reminder_time_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reminder_time_minutes: parseInt(e.target.value),
                  })
                }
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg min-w-20 justify-center">
                <span className="text-lg font-semibold text-blue-700">
                  {formData.reminder_time_minutes}
                </span>
                <span className="text-sm text-blue-600">min</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                Sound Settings
              </label>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-medium transition-colors ${
                    formData.enable_sound ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {formData.enable_sound ? "Enabled" : "Disabled"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      enable_sound: !formData.enable_sound,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.enable_sound ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.enable_sound ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
            {formData.enable_sound && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Notification Sound
                </label>

                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={handleDropdownToggle}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {getSelectedSoundLabel()}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {SOUND_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSoundSelect(option)}
                          className={`w-full text-left px-4 py-3 cursor-pointer transition-colors flex items-center justify-between group ${
                            formData.sound_file === option.value
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 flex items-center justify-center">
                              <Play className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500 font-mono">
                                {option.value}
                              </div>
                            </div>
                          </div>
                          {formData.sound_file === option.value && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-6 border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
      <audio ref={audioRef} preload="auto" />
    </div>
  );
}
