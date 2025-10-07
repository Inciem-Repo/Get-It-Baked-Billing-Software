import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";

// Global dropdown manager to handle single dropdown open at a time
let activeDropdownId = null;
const dropdownInstances = new Set();
const lastShortcutInstance = {};

const SearchableDropdown = ({
  items = [],
  fetchItems = null,
  placeholder = "Select an option...",
  onSelect,
  shortcut = null,
  label = "",
  value = null,
  disabled = false,
  maxHeight = "200px",
  labelKey = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedItem, setSelectedItem] = useState(value);
  const [dropdownDirection, setDropdownDirection] = useState("down");
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [isInTable, setIsInTable] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  const [dynamicItems, setDynamicItems] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!fetchItems) return;

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchItems(searchTerm);
        setDynamicItems(results || []);
      } catch (error) {
        console.error("Dropdown fetch error:", error);
        setDynamicItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, fetchItems]);

  useEffect(() => {
    dropdownInstances.add(instanceId.current);
    return () => {
      dropdownInstances.delete(instanceId.current);
      if (activeDropdownId === instanceId.current) {
        activeDropdownId = null;
      }
    };
  }, []);

  // Close other dropdowns when this one opens
  const closeOtherDropdowns = () => {
    if (activeDropdownId && activeDropdownId !== instanceId.current) {
      window.dispatchEvent(
        new CustomEvent("closeDropdown", {
          detail: { excludeId: instanceId.current },
        })
      );
    }
    activeDropdownId = instanceId.current;
  };

  // Listen for close dropdown events
  useEffect(() => {
    const handleCloseDropdown = (event) => {
      if (event.detail?.excludeId !== instanceId.current) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchTerm("");
      }
    };

    window.addEventListener("closeDropdown", handleCloseDropdown);
    return () =>
      window.removeEventListener("closeDropdown", handleCloseDropdown);
  }, []);

  // Handle scroll events to update dropdown position
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen && isInTable) {
        calculateDropdownPosition();
      }
    };

    if (isOpen && isInTable) {
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [isOpen, isInTable]);

  // save this as the last instance for this shortcut
  useEffect(() => {
    if (shortcut?.key) {
      lastShortcutInstance[shortcut.key.toLowerCase()] = instanceId.current;
    }

    return () => {
      if (
        shortcut?.key &&
        lastShortcutInstance[shortcut.key.toLowerCase()] === instanceId.current
      ) {
        delete lastShortcutInstance[shortcut.key.toLowerCase()];
      }
    };
  }, [shortcut]);

  // Handle keyboard shortcuts - only open if no other dropdown is active
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!shortcut) return;

      const matchKey =
        shortcut.key && e.key.toLowerCase() === shortcut.key.toLowerCase();
      const matchShift = shortcut.shift ? e.shiftKey : true;
      const matchCtrl = shortcut.ctrl ? e.ctrlKey : true;
      const matchAlt = shortcut.alt ? e.altKey : true;
      if (
        matchKey &&
        matchShift &&
        matchCtrl &&
        matchAlt &&
        lastShortcutInstance[shortcut.key.toLowerCase()] === instanceId.current
      ) {
        e.preventDefault();
        if (!activeDropdownId || activeDropdownId === instanceId.current) {
          closeOtherDropdowns();
          inputRef.current?.focus();
          calculateDropdownPosition();
          setIsOpen(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcut]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (activeDropdownId === instanceId.current) {
          activeDropdownId = null;
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update selected item when value prop changes
  useEffect(() => {
    setSelectedItem(value);
  }, [value]);
  const displayedItems = fetchItems ? dynamicItems : items;
  const filteredItems = displayedItems?.filter((item) =>
    item?.[labelKey]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (inputRef.current) {
      const tableParent = inputRef.current.closest(
        "table, .overflow-x-auto, .overflow-auto"
      );
      setIsInTable(!!tableParent);
    }
  }, []);

  // Calculate dropdown position for table usage
  const calculateDropdownPosition = () => {
    if (!inputRef.current) return { top: 0, left: 0, width: 0 };

    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = parseInt(maxHeight) || 200;
    let top = rect.bottom + window.scrollY;
    let direction = "down";

    if (spaceBelow < dropdownHeight + 10 && spaceAbove > dropdownHeight + 10) {
      top = rect.top + window.scrollY - dropdownHeight - 5;
      direction = "up";
    }

    setDropdownDirection(direction);
    setDropdownPosition({
      top,
      left: rect.left + window.scrollX,
      width: rect.width,
    });

    return direction;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === "Enter" || e.key === "ArrowDown")) {
      e.preventDefault();
      closeOtherDropdowns();
      calculateDropdownPosition();
      setIsOpen(true);
      setHighlightedIndex(0);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
          handleSelect(filteredItems[highlightedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        activeDropdownId = null;
        inputRef.current?.blur();
        break;
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (item) => {
    setSelectedItem(item);
    setSearchTerm("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    activeDropdownId = null;
    onSelect?.(item);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setHighlightedIndex(value ? 0 : -1);

    if (!isOpen && value) {
      closeOtherDropdowns();
      calculateDropdownPosition();
      setIsOpen(true);
    }
  };

  const handleInputClick = () => {
    if (!isOpen) {
      closeOtherDropdowns();
    }
    calculateDropdownPosition();
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHighlightedIndex(filteredItems.length > 0 ? 0 : -1);
    } else {
      activeDropdownId = null;
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            className={`w-full px-3 py-2 pr-10 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
              disabled
                ? "bg-gray-100 cursor-not-allowed"
                : "bg-white cursor-pointer"
            }`}
            placeholder={placeholder}
            value={
              searchTerm !== ""
                ? searchTerm
                : isOpen
                ? ""
                : selectedItem?.[labelKey] || ""
            }
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedItem(null);
              setHighlightedIndex(e.target.value ? 0 : -1);
              if (!isOpen) {
                closeOtherDropdowns();
                calculateDropdownPosition();
                setIsOpen(true);
              }
            }}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoComplete="off"
          />

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {searchTerm ? (
              <Search className="h-4 w-4 text-black" />
            ) : (
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  isOpen ? "transform rotate-180" : ""
                }`}
              />
            )}
          </div>
        </div>

        {isOpen && (
          <>
            {isInTable ? (
              <div
                className="fixed bg-white border border-gray-300 rounded-md shadow-xl"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`,
                  maxHeight,
                  zIndex: 10,
                }}
              >
                <div className="overflow-auto" style={{ maxHeight }}>
                  <ul ref={listRef} className="py-1">
                    {loading ? (
                      <li className="px-3 py-2 text-sm text-gray-500 italic">
                        Loading...
                      </li>
                    ) : filteredItems.length > 0 ? (
                      filteredItems.map((item, index) => (
                        <li
                          key={item.id}
                          className={`px-3 py-2 cursor-pointer text-sm ${
                            index === highlightedIndex
                              ? "bg-blue-100 text-blue-900"
                              : "text-gray-900 hover:bg-gray-100"
                          }`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                        >
                          {item?.[labelKey]}
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-2 text-sm text-gray-500 italic">
                        {searchTerm
                          ? `No results found for "${searchTerm}"`
                          : "No items available"}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div
                className={`absolute w-full bg-white border border-gray-300 rounded-md shadow-xl ${
                  dropdownDirection === "up"
                    ? "bottom-full mb-1"
                    : "top-full mt-1"
                }`}
              >
                <div className="overflow-auto" style={{ maxHeight }}>
                  <ul ref={listRef} className="py-1">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item, index) => (
                        <li
                          key={item.id}
                          className={`px-3 py-2 cursor-pointer text-sm ${
                            index === highlightedIndex
                              ? "bg-blue-100 text-blue-900"
                              : "text-gray-900 hover:bg-gray-100"
                          }`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs text-gray-500">
                              #{item.id}
                            </span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-2 text-sm text-gray-500 italic">
                        {searchTerm
                          ? `No results found for "${searchTerm}"`
                          : "No items available"}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchableDropdown;
