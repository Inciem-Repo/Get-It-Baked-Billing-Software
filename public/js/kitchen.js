// Hardcoded data
const MOCK_ORDERS = [
  {
    id: "1",
    kotToken: "KOT-001",
    priority: "high",
    status: "preparing",
    deliveryTime: new Date(Date.now() + 20 * 60000), // 20 minutes from now
    items: [
      {
        name: "Margherita Pizza",
        quantity: 2,
        notes: "Extra cheese, no basil",
      },
      { name: "Caesar Salad", quantity: 1, notes: "Dressing on side" },
      { name: "Garlic Bread", quantity: 3 },
    ],
  },
  {
    id: "2",
    kotToken: "KOT-002",
    priority: "medium",
    status: "pending",
    deliveryTime: new Date(Date.now() + 45 * 60000), // 45 minutes from now
    items: [
      { name: "Grilled Chicken", quantity: 1, notes: "Well done" },
      { name: "French Fries", quantity: 2 },
    ],
  },
  {
    id: "3",
    kotToken: "KOT-003",
    priority: "high",
    status: "preparing",
    deliveryTime: new Date(Date.now() + 15 * 60000), // 15 minutes from now
    items: [
      { name: "Beef Burger", quantity: 2, notes: "No onions, extra pickles" },
      { name: "Onion Rings", quantity: 1 },
      { name: "Coke", quantity: 2, notes: "No ice" },
    ],
  },
  {
    id: "4",
    kotToken: "KOT-004",
    priority: "low",
    status: "pending",
    deliveryTime: new Date(Date.now() + 75 * 60000), // 75 minutes from now
    items: [
      { name: "Pasta Carbonara", quantity: 1 },
      { name: "Tiramisu", quantity: 2 },
    ],
  },
];

// Helper functions
function getTimeRemaining(deliveryTime, currentTime) {
  const diff = deliveryTime.getTime() - currentTime.getTime();
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { minutes, seconds, totalMinutes: minutes };
}

function getUrgencyClass(totalMinutes) {
  if (totalMinutes < 30) return "urgent";
  if (totalMinutes < 60) return "warning";
  return "normal";
}

function getPriorityColor(priority) {
  switch (priority) {
    case "high":
      return "hsl(var(--high-priority))";
    case "medium":
      return "hsl(var(--medium-priority))";
    case "low":
      return "hsl(var(--low-priority))";
    default:
      return "hsl(var(--muted))";
  }
}

function getStatusBadge(status) {
  const styles = {
    pending: "bg-secondary text-secondary-foreground",
    preparing: "bg-warning text-warning-foreground",
    ready: "bg-normal text-normal-foreground",
  };
  return styles[status] || styles.pending;
}

// Render orders
function renderOrders() {
  const currentTime = new Date();
  const ordersContainer = document.getElementById("orders-container");

  // Clear existing orders
  ordersContainer.innerHTML = "";

  // Add each order to the container
  MOCK_ORDERS.forEach((order) => {
    const timeRemaining = getTimeRemaining(order.deliveryTime, currentTime);
    const urgency = getUrgencyClass(timeRemaining.totalMinutes);
    const priorityColor = getPriorityColor(order.priority);
    const statusBadge = getStatusBadge(order.status);

    const orderElement = document.createElement("article");
    orderElement.className = `order-card rounded-lg p-4 transition-all duration-300 border-2 ${
      urgency === "urgent"
        ? "bg-urgent/10 border-urgent shadow-lg shadow-urgent/20"
        : urgency === "warning"
        ? "bg-warning/10 border-warning shadow-lg shadow-warning/20"
        : "bg-card border-border shadow-md"
    }`;
    orderElement.setAttribute("data-order-id", order.id);

    // Create order HTML
    orderElement.innerHTML = `
                    <!-- Header -->
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <h2 class="text-2xl font-bold text-foreground">
                                ${order.kotToken}
                            </h2>
                            <span
                                class="px-2 py-1 rounded-full text-xs font-semibold uppercase priority-badge"
                                style="background-color: ${priorityColor}; color: hsl(var(--background));"
                            >
                                ${order.priority}
                            </span>
                            <span class="px-2 py-1 rounded-full text-xs font-semibold uppercase ${statusBadge} status-badge">
                                ${order.status}
                            </span>
                        </div>
                        <div class="flex items-center gap-3">
                            ${
                              timeRemaining.totalMinutes < 30
                                ? '<i data-lucide="alert-circle" class="w-6 h-6 text-urgent animate-pulse urgent-indicator"></i>'
                                : ""
                            }
                            <div class="text-right">
                                <div class="text-xs text-muted-foreground">Delivery Time</div>
                                <div class="text-sm font-bold text-foreground delivery-time">
                                    ${order.deliveryTime.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Order Items -->
                    <div class="space-y-2">
                        ${order.items
                          .map(
                            (item) => `
                            <div class="bg-secondary/50 rounded-md p-2 border border-border">
                                <div class="flex justify-between items-start">
                                    <span class="font-semibold text-foreground">
                                        ${item.name}
                                    </span>
                                    <span class="text-lg font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        x${item.quantity}
                                    </span>
                                </div>
                                ${
                                  item.notes
                                    ? `
                                    <div class="mt-1 text-xs text-muted-foreground italic bg-background/50 p-1.5 rounded border-l-2 border-accent">
                                        Note: ${item.notes}
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                `;

    ordersContainer.appendChild(orderElement);
  });

  // Reinitialize Lucide icons for new elements
  lucide.createIcons();
}

// Initialize Lucide icons
lucide.createIcons();

// Update current time every second
function updateCurrentTime() {
  const now = new Date();
  document.getElementById("current-time").textContent =
    now.toLocaleTimeString();

  // Also update the orders display to reflect time changes
  renderOrders();
}

// Initial render
updateCurrentTime();

// Update time and orders every second
setInterval(updateCurrentTime, 1000);
