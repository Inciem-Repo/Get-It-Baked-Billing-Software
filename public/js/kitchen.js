// Use server-side data
let orders = [];
let config = null;
let audioContext = null;
let alarmOscillator = null;
let isAlarmPlaying = false;
let alarmInterval = null;
let alarmAudio = null;

async function fetchKots() {
  try {
    const res = await fetch("/api/kots");
    orders = await res.json();
    renderOrders();
  } catch (err) {
    console.error("Error fetching KOTs:", err);
  }
}

async function fetchKotConfig() {
  try {
    const res = await fetch("/api/kots/config");
    const response = await res.json();
    if (response.success) {
      config = response.data;
    }
  } catch (error) {
    console.log("Error fetching config:", error);
  }
}

function refreshKOTData() {
  fetchKots();
  fetchKotConfig();
}
refreshKOTData();
setInterval(refreshKOTData, 10000);

// Helper functions
function getTimeRemaining(deliveryDate, deliveryTime) {
  const currentTime = new Date();
  const deliveryDateTime = new Date(`${deliveryDate}T${deliveryTime}`);
  const diff = deliveryDateTime.getTime() - currentTime.getTime();

  if (diff <= 0)
    return { overdue: true, totalMinutes: 0, minutes: 0, seconds: 0 };

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((diff % 60000) / 1000);

  return {
    hours,
    minutes,
    seconds,
    totalMinutes,
    overdue: false,
  };
}

function formatTimeRemaining(timeRemaining, status) {
  if (status === "cancelled") return "Cancelled";
  if (status === "ready") return "Ready";
  if (timeRemaining.overdue) return "OVERDUE";

  if (timeRemaining.hours > 0) {
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  } else {
    return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  }
}

function getCardColor(totalMinutes, status) {
  if (status === "ready") return "ready";
  if (status === "cancelled") return "cancelled";
  const reminderTime = config ? config.reminder_time_minutes : 30;
  if (totalMinutes < reminderTime) return "urgent";
  if (totalMinutes < 60) return "warning";
  return "normal";
}

function getStatusInfo(status) {
  const statusMap = {
    ready: {
      icon: "check-circle",
      label: "Ready",
      bgClass: "bg-green-100",
      textClass: "text-green-800",
      iconClass: "text-green-600",
    },
    baking: {
      icon: "clock",
      label: "Baking",
      bgClass: "bg-orange-100",
      textClass: "text-orange-800",
      iconClass: "text-orange-600",
    },
    pending: {
      icon: "clock",
      label: "Pending",
      bgClass: "bg-blue-100",
      textClass: "text-blue-800",
      iconClass: "text-blue-600",
    },
    cancelled: {
      icon: "x-circle",
      label: "Cancelled",
      bgClass: "bg-red-100",
      textClass: "text-red-800",
      iconClass: "text-red-600",
    },
  };
  return statusMap[status] || statusMap.pending;
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2);
}

function getCustomerInitials(customerName) {
  if (!customerName) return "C";
  return customerName
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(customerId) {
  const colors = [
    "bg-teal-600",
    "bg-teal-700",
    "bg-yellow-500",
    "bg-yellow-600",
    "bg-teal-800",
    "bg-teal-900",
    "bg-blue-500",
    "bg-blue-600",
    "bg-purple-500",
    "bg-purple-600",
    "bg-pink-500",
    "bg-pink-600",
  ];
  return colors[customerId % colors.length] || "bg-gray-500";
}
function format12Hour(hours, minutes) {
  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12; // 0 → 12
  const formattedMinutes = String(minutes).padStart(2, "0");
  return `${formattedHours}:${formattedMinutes} ${period}`;
}

function convertTo12Hour(timeValue) {
  if (typeof timeValue === "string") {
    const [hours, minutes] = timeValue.split(":").map(Number);
    return format12Hour(hours, minutes);
  }

  if (timeValue instanceof Date) {
    const hours = timeValue.getHours();
    const minutes = timeValue.getMinutes();
    return format12Hour(hours, minutes);
  }

  return timeValue;
}

// Sort orders by nearest delivery date and time (closest first)
function sortOrders(ordersList) {
  return ordersList.sort((a, b) => {
    const dateA = new Date(`${a.deliveryDate}T${a.deliveryTime}`);
    const dateB = new Date(`${b.deliveryDate}T${b.deliveryTime}`);
    return dateA - dateB;
  });
}

function startContinuousAlarm() {
  if (!config || config.enable_sound !== 1) {
    console.log("Sound is disabled in configuration");
    return;
  }

  if (isAlarmPlaying) return;
  const soundFile =
    config && config.sound_file ? config.sound_file : "alarm_1.mp3";
  alarmAudio = new Audio(`/audio/${soundFile}`);
  alarmAudio.volume = 1;

  const playAlarm = () => {
    alarmAudio.play().catch(() => {
      document.body.addEventListener("click", () => alarmAudio.play(), {
        once: true,
      });
    });
  };

  playAlarm();
  alarmInterval = setInterval(() => {
    alarmAudio.currentTime = 0;
    playAlarm();
  }, 2000);

  isAlarmPlaying = true;
}

function stopAlarm() {
  if (alarmInterval) clearInterval(alarmInterval);
  if (alarmAudio) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }
  isAlarmPlaying = false;
}

// Shake effect for urgent orders
function addShakeEffect(element) {
  element.classList.add("animate-shake");
}

function removeShakeEffect(element) {
  element.classList.remove("animate-shake");
}

// Check for urgent orders and trigger effects
function checkUrgentOrders() {
  let hasUrgentOrders = false;
  let urgentOrderCount = 0;
  const reminderTime = config ? config.reminder_time_minutes : 30;

  document.querySelectorAll(".order-card").forEach((card) => {
    removeShakeEffect(card);
  });

  orders.forEach((order) => {
    if (order.status !== "ready" && order.status !== "cancelled") {
      const timeRemaining = getTimeRemaining(
        order.deliveryDate,
        order.deliveryTime
      );
      if (
        timeRemaining.totalMinutes < reminderTime &&
        timeRemaining.totalMinutes > 0
      ) {
        hasUrgentOrders = true;
        urgentOrderCount++;
        const orderCard = document.querySelector(
          `[data-order-id="${order.id}"]`
        );
        if (orderCard) {
          addShakeEffect(orderCard);
        }
      }
    }
  });

  if (hasUrgentOrders && !isAlarmPlaying) {
    startContinuousAlarm();
  } else if (!hasUrgentOrders && isAlarmPlaying) {
    stopAlarm();
  }
}

// Render orders function
function renderOrders(filter = "upcoming") {
  const ordersContainer = document.getElementById("orders-container");
  const sortedOrders = sortOrders([...orders]);
  let filteredOrders;

  switch (filter) {
    case "upcoming":
      filteredOrders = sortedOrders.filter(
        (order) => order.status !== "ready" && order.status !== "cancelled"
      );
      break;
    case "pending":
      filteredOrders = sortedOrders.filter(
        (order) => order.status === "pending"
      );
      break;
    case "baking":
      filteredOrders = sortedOrders.filter(
        (order) => order.status === "baking"
      );
      break;
    case "ready":
      filteredOrders = sortedOrders.filter((order) => order.status === "ready");
      break;
    case "cancelled":
      filteredOrders = sortedOrders.filter(
        (order) => order.status === "cancelled"
      );
      break;
    case "all":
    default:
      filteredOrders = sortedOrders;
      break;
  }

  if (filteredOrders.length === 0) {
    ordersContainer.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-500">
        <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-4"></i>
        <p>No orders found with the selected filter.</p>
      </div>
    `;
    lucide.createIcons();
    if (isAlarmPlaying) {
      stopAlarm();
    }
    return;
  }

  ordersContainer.innerHTML = filteredOrders
    .map((order) => {
      const timeRemaining = getTimeRemaining(
        order.deliveryDate,
        order.deliveryTime
      );
      const cardColor = getCardColor(timeRemaining.totalMinutes, order.status);
      const statusInfo = getStatusInfo(order.status);
      const total = calculateTotal(order.items || []);
      const customerInitials = getCustomerInitials(order.customerName);
      const avatarColor = getAvatarColor(order.customerId);
      const formattedTime = formatTimeRemaining(timeRemaining, order.status);
      let cardBgClass = "bg-white";
      let borderColor = "border-l-gray-200";
      let urgentClass = "";

      if (order.status === "ready") {
        cardBgClass = "bg-green-50";
        borderColor = "border-l-green-500";
      } else if (order.status === "cancelled") {
        cardBgClass = "bg-red-50";
        borderColor = "border-l-red-500";
      } else {
        if (cardColor === "urgent") {
          cardBgClass = "bg-red-50";
          borderColor = "border-l-red-500";
          urgentClass = "urgent-order";
        } else if (cardColor === "warning") {
          cardBgClass = "bg-yellow-50";
          borderColor = "border-l-yellow-500";
        } else {
          cardBgClass = "bg-blue-50";
          borderColor = "border-l-blue-500";
        }
      }

      const deliveryDateTime = new Date(
        `${order.deliveryDate}T${order.deliveryTime}`
      );

      return `
        <article class="order-card ${cardBgClass} rounded-lg border-l-4 ${borderColor} shadow-sm p-4 ${urgentClass}" data-status="${
        order.status
      }" data-order-id="${order.id}">
          <!-- Header with Avatar -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold text-sm">
                ${customerInitials}
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">
                  ${order.customerName || "Customer"}
                </h3>
                <p class="text-xs text-gray-500">
                  ${order.kotToken}
                </p>
                ${
                  cardColor === "urgent" &&
                  order.status !== "ready" &&
                  order.status !== "cancelled"
                    ? `<div class="flex items-center gap-1 mt-1 text-red-600 text-xs"><i data-lucide="alert-triangle" class="w-3 h-3"></i> URGENT (${
                        config ? config.reminder_time_minutes : 30
                      }m)</div>`
                    : ""
                }
              </div>
            </div>
            <span class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
              statusInfo.bgClass
            } ${statusInfo.textClass}">
              <i data-lucide="${statusInfo.icon}" class="w-3 h-3 ${
        statusInfo.iconClass
      }"></i>
              ${statusInfo.label}
            </span>
          </div>

          <!-- Date and Time -->
          <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
            <span>${deliveryDateTime.toLocaleDateString()}</span>
            <span>${convertTo12Hour(deliveryDateTime)}</span>
          </div>

          <!-- Time Remaining -->
          <div class="mb-4 p-2 rounded-lg ${
            order.status === "ready"
              ? "bg-green-100 text-green-800 border border-green-200"
              : order.status === "cancelled"
              ? "bg-red-100 text-red-800 border border-red-200"
              : cardColor === "urgent"
              ? "bg-red-100 text-red-800 border border-red-200 animate-pulse"
              : cardColor === "warning"
              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
              : "bg-blue-100 text-blue-800 border border-blue-200"
          }">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium">
                ${
                  order.status === "ready"
                    ? "Status:"
                    : order.status === "cancelled"
                    ? "Status:"
                    : "Delivery in:"
                }
              </span>
              <span class="font-bold">
                ${formattedTime}
              </span>
            </div>
          </div>

          <!-- Items Table -->
          <div class="mb-4">
            <table class="w-full text-sm">
              <thead class="border-b">
                <tr class="text-gray-500 text-xs">
                  <th class="text-left py-2 font-medium">Items</th>
                  <th class="text-center py-2 font-medium w-12">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${(order.items || [])
                  .map(
                    (item) => `
                  <tr class="border-b last:border-0">
                    <td class="py-2 text-gray-900">
                      <div>${item.productName || "Item"}</div>
                      ${
                        item.notes
                          ? `<div class="text-xs text-gray-500 italic">Note: ${item.notes}</div>`
                          : ""
                      }
                    </td>
                    <td class="py-2 text-center text-gray-500">
                      ${item.quantity || 1}
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          
          <!-- Action Buttons - Only show for non-ready, non-cancelled orders -->
          ${
            order.status !== "ready" && order.status !== "cancelled"
              ? `
          <div class="flex gap-2">
            <button class="mark-baking-btn flex-1 text-orange-700 border border-orange-700 hover:bg-orange-50 px-3 py-2 rounded-lg transition-colors" data-order-id="${order.id}">
              Mark Baking
            </button>
            <button class="mark-ready-btn flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors" data-order-id="${order.id}">
              Mark Ready
            </button>
          </div>
          `
              : ""
          }
        </article>
      `;
    })
    .join("");

  lucide.createIcons();
  setTimeout(() => {
    checkUrgentOrders();
  }, 100);
  attachEventListeners();
}

// Attach event listeners
function attachEventListeners() {
  document.querySelectorAll(".mark-baking-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const orderId = this.getAttribute("data-order-id");
      const order = orders.find((o) => o.id == orderId);

      if (order) {
        order.status = "baking";
        renderOrders(
          document
            .querySelector(".filter-btn.active")
            .getAttribute("data-filter")
        );
        await updateOrderStatus(orderId, "baking");
      }
    });
  });

  document.querySelectorAll(".mark-ready-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const orderId = this.getAttribute("data-order-id");
      const order = orders.find((o) => o.id == orderId);

      if (order) {
        order.status = "ready";
        renderOrders(
          document
            .querySelector(".filter-btn.active")
            .getAttribute("data-filter")
        );
        await updateOrderStatus(orderId, "ready");
        setTimeout(checkUrgentOrders, 100);
      }
    });
  });
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`/api/kots/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (res.ok) {
      console.log(`Order ${orderId} marked as ${status}`);
    } else {
      console.error("Failed to update:", data.message);
    }
  } catch (err) {
    console.error("API error:", err);
  }
}

// Update the filter buttons to include all statuses
function updateFilterButtons() {
  const filterContainer = document.querySelector(".flex.gap-3.mb-6");
  filterContainer.innerHTML = `
    <button class="filter-btn active px-4 py-2 rounded-lg border border-gray-300 bg-teal-700 text-white hover:bg-teal-800 transition-colors" data-filter="upcoming">
      Upcoming
    </button>
    <button class="filter-btn px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors" data-filter="all">
      All
    </button>
    <button class="filter-btn px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors" data-filter="pending">
      Pending
    </button>
    <button class="filter-btn px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors" data-filter="baking">
      Baking
    </button>
    <button class="filter-btn px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors" data-filter="ready">
      Ready
    </button>
    <button class="filter-btn px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors" data-filter="cancelled">
      Cancelled
    </button>
  `;
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  lucide.createIcons();
  updateFilterButtons();

  function updateCurrentDate() {
    const now = new Date();
    const dateElement = document.getElementById("current-date");
    dateElement.textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  updateCurrentDate();
  setInterval(updateCurrentDate, 60000);

  // Check for urgent orders every 10 seconds
  setInterval(checkUrgentOrders, 10000);

  // Filter functionality
  setTimeout(() => {
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((button) => {
      button.addEventListener("click", function () {
        filterButtons.forEach((btn) =>
          btn.classList.remove("active", "bg-teal-700", "text-white")
        );
        this.classList.add("active", "bg-teal-700", "text-white");

        const filter = this.getAttribute("data-filter");
        renderOrders(filter);
      });
    });
    renderOrders("upcoming");
  }, 100);
});

// Stop alarm when page is hidden (optional)
document.addEventListener("visibilitychange", function () {
  if (document.hidden && isAlarmPlaying) {
    stopAlarm();
  }
});
