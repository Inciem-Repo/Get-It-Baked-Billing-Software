import { test } from "@playwright/test";
import { _electron as electron } from "playwright";

// Random helper functions
function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sample products and customers
const products = [
  "Red Vampire",
  "Molten Lava",
  "Praline Bang",
  "Chocolate Storm",
];
const customers = ["Walking Customer", "John Doe", "Alice Smith", "Bob Brown"];
const paymentTypes = ["Cash", "Online"];

test("POS billing flow automation - random scenarios", async () => {
  test.setTimeout(300000); // 5 minutes for multiple bills

  console.log("🚀 Launching Electron app...");
  const app = await electron.launch({ args: ["."] });
  const window = await app.firstWindow();

  await window.waitForLoadState("domcontentloaded");
  await window.waitForTimeout(2000);
  console.log("✅ App launched successfully!");

  // Listen to console logs from the app
  window.on("console", (msg) => console.log("APP LOG:", msg.text()));

  // Simulate multiple bills
  const numberOfBills = 3; // number of bills to add
  for (let i = 0; i < numberOfBills; i++) {
    const customer = randomFromArray(customers);
    const numberOfItems = randomInt(1, 3); // 1-3 items per bill
    const paymentType = randomFromArray(paymentTypes);

    console.log(
      `📝 Creating bill #${
        i + 1
      } for customer: ${customer}, payment: ${paymentType}`
    );

    // Select or add customer
    const customerInput = window.locator(
      'input[placeholder="Search and select customer..."]'
    );
    await customerInput.waitFor({ state: "visible", timeout: 10000 });
    await customerInput.fill(customer); // ✅ use the defined variable
    await customerInput.press("Enter");
    await window.waitForTimeout(500);

    // Add random items
    for (let j = 0; j < numberOfItems; j++) {
      const productName = randomFromArray(products);
      const quantity = randomInt(1, 5);

      console.log(`   ➕ Adding product: ${productName} (Qty: ${quantity})`);

     const productInput = window
        .locator('input[placeholder="Search and select product..."]')
        .nth(rowIndex);

      await productInput.fill(productName);
      await window.locator(`li:has-text("${productName}")`).click();

      // Wait for dropdown and select exact match
      const dropdown = window.locator("div.fixed.bg-white.border");
      await dropdown.waitFor({ state: "visible", timeout: 5000 });
      const option = dropdown.locator("li", {
        hasText: new RegExp(`^${productName}$`),
      });
      await option.waitFor({ state: "visible", timeout: 5000 });
      await option.click();
      await productInput.press("Enter");

      // Enter quantity
      const quantityInput = window.locator('input[type="number"]').first();
      await quantityInput.fill(quantity.toString());
      await window.waitForTimeout(300);
    }

    // Select payment type
    const paymentSelect = window.locator("select");
    await paymentSelect.selectOption({ label: paymentType });

    // Save bill
    const saveButton = window.locator("button", { hasText: "Save Details" });
    await saveButton.click();

    await window.waitForTimeout(1000); // wait for save to finish
  }

  console.log("✅ All random bills added successfully.");
  await app.close();
});
