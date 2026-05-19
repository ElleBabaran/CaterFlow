import test from "node:test";
import assert from "node:assert/strict";
import { calculateOrderFinance, estimateCookingMinutes, hasCurrencyMarker, parseBudgetDetails } from "../budget";

test("parseBudgetDetails extracts amount and currency", () => {
  const parsed = parseBudgetDetails("₱ 150,000");
  assert.equal(parsed.currency, "PHP");
  assert.equal(parsed.value, 150000);
});

test("parseBudgetDetails defaults to PHP when currency missing", () => {
  const parsed = parseBudgetDetails("250000");
  assert.equal(parsed.currency, "PHP");
  assert.equal(parsed.value, 250000);
});

test("hasCurrencyMarker identifies currency markers", () => {
  assert.equal(hasCurrencyMarker("USD 5000"), true);
  assert.equal(hasCurrencyMarker("5000"), false);
});

test("calculateOrderFinance multiplies unit price by quantity and guests", () => {
  const finance = calculateOrderFinance(
    [
      { dish: "Adobo", price: "₱120", quantity: 2 },
      { dish: "Iced Tea", price: "₱30" },
    ],
    50,
    "₱20,000"
  );

  assert.equal(finance.estimatedTotal, 13500);
  assert.equal(finance.totalPerGuest, 270);
  assert.equal(finance.remaining, 6500);
  assert.equal(finance.isOverBudget, false);
});

test("estimateCookingMinutes returns per-item and total estimates", () => {
  const estimate = estimateCookingMinutes([{ dish: "Roast Beef", category: "Main" }], 100);
  assert.equal(estimate.items.length, 1);
  assert.equal(estimate.items[0].minutes > 60, true);
  assert.equal(estimate.totalMinutes >= estimate.items[0].minutes, true);
});
